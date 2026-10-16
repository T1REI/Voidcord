package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestDownloadDesktopArchive(t *testing.T) {
	previousDirectory, previousRelease := FilesDir, ReleaseData
	t.Cleanup(func() { FilesDir, ReleaseData = previousDirectory, previousRelease })
	FilesDir = t.TempDir()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("test archive"))
	}))
	defer server.Close()
	ReleaseData = GithubRelease{}
	ReleaseData.Assets = append(ReleaseData.Assets, struct {
		Name        string `json:"name"`
		DownloadURL string `json:"browser_download_url"`
	}{Name: "desktop.asar", DownloadURL: server.URL})
	if err := installLatestBuilds(); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(FilesDir, "desktop.asar"))
	if err != nil || string(data) != "test archive" {
		t.Fatalf("unexpected archive: %q, %v", data, err)
	}
	ReleaseData = GithubRelease{}
	if err := installLatestBuilds(); err == nil {
		t.Fatal("missing archive must fail")
	}
	data, _ = os.ReadFile(filepath.Join(FilesDir, "desktop.asar"))
	if string(data) != "test archive" {
		t.Fatal("failed update modified the archive")
	}
}
