"use strict";

document.addEventListener("DOMContentLoaded", function () {

    var form = document.getElementById("tiktokForm");
    var urlInput = document.getElementById("tiktokUrl");
    var pasteBtn = document.getElementById("pasteBtn");
    var downloadBtn = document.getElementById("downloadBtn");
    var statusEl = document.getElementById("tiktokStatus");
    var resultEl = document.getElementById("tiktokResult");

    var resultCover = document.getElementById("resultCover");
    var resultAuthor = document.getElementById("resultAuthor");
    var resultCaption = document.getElementById("resultCaption");
    var downloadHD = document.getElementById("downloadHD");
    var downloadSD = document.getElementById("downloadSD");
    var downloadAudio = document.getElementById("downloadAudio");

    /* ---- Paste from clipboard ---- */
    pasteBtn.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (text) {
                if (text && text.trim()) {
                    urlInput.value = text.trim();
                    showStatus("", "");
                }
            }).catch(function () {
                showStatus("Could not access clipboard. Please paste manually.", "error");
            });
        } else {
            showStatus("Clipboard not supported. Please long-press and paste.", "error");
        }
    });

    /* ---- Form submit ---- */
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var url = urlInput.value.trim();

        /* Hide previous results */
        resultEl.style.display = "none";
        downloadHD.style.display = "none";
        downloadSD.style.display = "none";
        downloadAudio.style.display = "none";

        /* Validate */
        if (!url) {
            showStatus("Please paste a TikTok video link.", "error");
            return;
        }

        if (url.indexOf("tiktok.com") === -1) {
            showStatus("This does not look like a TikTok link. Please check the URL.", "error");
            return;
        }

        /* Loading state */
        showStatus("Fetching video information... Please wait.", "");
        downloadBtn.disabled = true;
        downloadBtn.textContent = "Processing...";

        /* Call the API */
        fetch("https://www.tikwm.com/api/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "url=" + encodeURIComponent(url) + "&hd=1"
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            if (data.code === 0 && data.data) {
                showResult(data.data);
            } else {
                showStatus(
                    data.msg || "Could not process this video. It may be private, deleted, or the link is incorrect.",
                    "error"
                );
            }
        })
        .catch(function (err) {
            console.error("TikTok fetch error:", err);
            showStatus(
                "Connection error. Please check your internet connection and try again.",
                "error"
            );
        })
        .finally(function () {
            downloadBtn.disabled = false;
            downloadBtn.textContent = "Download Video";
        });
    });

    /* ---- Show status message ---- */
    function showStatus(message, type) {
        if (!message) {
            statusEl.textContent = "";
            statusEl.className = "status";
            return;
        }
        statusEl.textContent = message;
        statusEl.className = "status" + (type === "error" ? " error" : "");
    }

    /* ---- Display results ---- */
    function showResult(data) {
        var baseUrl = "https://www.tikwm.com";

        /* Thumbnail */
        var cover = data.cover || data.origin_cover || "";
        resultCover.src = cover;
        resultCover.alt = "TikTok video thumbnail";

        /* Author */
        if (data.author) {
            resultAuthor.textContent = "@" + (data.author.unique_id || data.author.nickname || "user");
        } else {
            resultAuthor.textContent = "TikTok Creator";
        }

        /* Caption */
        resultCaption.textContent = data.title || "TikTok Video";

        /* Build download URLs */
        var hdUrl = buildUrl(data.hdplay, baseUrl);
        var playUrl = buildUrl(data.play, baseUrl);
        var wmUrl = buildUrl(data.wmplay, baseUrl);
        var musicUrl = buildUrl(data.music, baseUrl);

        /* 
           FIX: Determine the best no-watermark VIDEO url
           Sometimes hdplay returns an audio file.
           We check if hdplay contains audio indicators.
           If so, fall back to the standard play url for video.
        */
        var bestVideoUrl = "";

        if (hdUrl && !isAudioUrl(hdUrl)) {
            bestVideoUrl = hdUrl;
        } else if (playUrl && !isAudioUrl(playUrl)) {
            bestVideoUrl = playUrl;
        } else if (hdUrl) {
            bestVideoUrl = hdUrl;
        } else if (playUrl) {
            bestVideoUrl = playUrl;
        }

        /* Determine standard quality url (different from best) */
        var standardUrl = "";

        if (wmUrl) {
            standardUrl = wmUrl;
        } else if (playUrl && playUrl !== bestVideoUrl) {
            standardUrl = playUrl;
        }

        /* HD (No Watermark) - force download as MP4 */
        if (bestVideoUrl) {
            downloadHD.style.display = "block";
            downloadHD.onclick = function (e) {
                e.preventDefault();
                forceDownload(bestVideoUrl, "tiktok_hd_no_watermark.mp4");
            };
        }

        /* Standard / Watermarked */
        if (standardUrl) {
            downloadSD.style.display = "block";
            downloadSD.onclick = function (e) {
                e.preventDefault();
                forceDownload(standardUrl, "tiktok_standard.mp4");
            };
        }

        /* Audio */
        if (musicUrl) {
            downloadAudio.style.display = "block";
            downloadAudio.onclick = function (e) {
                e.preventDefault();
                forceDownload(musicUrl, "tiktok_audio.mp3");
            };
        }

        resultEl.style.display = "block";
        showStatus("✓ Video found! Choose your download format below.", "");
    }

    /* ---- Check if URL looks like audio ---- */
    function isAudioUrl(url) {
        if (!url) return false;
        var lower = url.toLowerCase();
        return (
            lower.indexOf(".mp3") !== -1 ||
            lower.indexOf("type=music") !== -1 ||
            lower.indexOf("/music/") !== -1 ||
            lower.indexOf("mime_type=audio") !== -1
        );
    }

    /* ---- Helper: build full URL ---- */
    function buildUrl(path, baseUrl) {
        if (!path) return "";
        if (path.indexOf("http") === 0) return path;
        return baseUrl + path;
    }

    /* ---- Force download via fetch + blob ---- */
    function forceDownload(url, filename) {
        showStatus("Downloading file... Please wait.", "");

        fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Download failed: " + response.status);
                }
                return response.blob();
            })
            .then(function (blob) {
                var blobUrl = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(function () {
                    URL.revokeObjectURL(blobUrl);
                }, 30000);
                showStatus("✓ Download started! Check your downloads folder.", "");
            })
            .catch(function (err) {
                console.error("Download error:", err);
                /* Fallback: open in new tab */
                showStatus("Direct download failed. Opening in new tab — long-press or right-click to save.", "error");
                window.open(url, "_blank");
            });
    }
});
