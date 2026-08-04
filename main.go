package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"mime"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"time"
)

func init() {
	// Ensure .wasm is served with the correct MIME type for streaming instantiation.
	_ = mime.AddExtensionType(".wasm", "application/wasm")
}

// securityHeaders sets defensive HTTP headers on every response.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		next.ServeHTTP(w, r)
	})
}

// noDirListing wraps a FileSystem so directory indexes are never served, while
// directories that contain an index.html (e.g. "/") still resolve normally.
type noDirListing struct{ fs http.FileSystem }

func (n noDirListing) Open(name string) (http.File, error) {
	f, err := n.fs.Open(name)
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, err
	}
	if info.IsDir() {
		index, err := n.fs.Open(filepath.Join(name, "index.html"))
		if err != nil {
			f.Close()
			return nil, fs.ErrPermission
		}
		index.Close()
	}
	return f, nil
}

func main() {
	port := flag.Int("port", 8000, "Port to bind")
	host := flag.String("host", "127.0.0.1", "Host interface to bind")
	flag.Parse()

	wd, err := filepath.Abs(".")
	if err != nil {
		log.Fatal(err)
	}

	addr := fmt.Sprintf("%s:%d", *host, *port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		// Requested port is busy: fall back to a free one so `make serve`
		// never fails just because a port is taken.
		free, ferr := net.Listen("tcp", fmt.Sprintf("%s:0", *host))
		if ferr != nil {
			log.Fatalf("Could not start server: %v", err)
		}
		listener = free
		requested := *port
		*port = listener.Addr().(*net.TCPAddr).Port
		addr = fmt.Sprintf("%s:%d", *host, *port)
		log.Printf("Port %d is busy, using %d instead", requested, *port)
	}

	server := &http.Server{
		Handler:           securityHeaders(http.FileServer(noDirListing{http.Dir(wd)})),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("DrawableForge dev server: http://%s", addr)
	log.Printf("Serving %s", wd)
	if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
