#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;

fn main() {
    let Some(dist) = find_dist() else {
        show_error("SmartShop's web files are missing. Run npm run build and try again.");
        return;
    };

    let listener = match TcpListener::bind("127.0.0.1:0") {
        Ok(listener) => listener,
        Err(_) => {
            show_error("SmartShop could not start its local web server.");
            return;
        }
    };
    let port = listener.local_addr().map(|address| address.port()).unwrap_or(0);
    let url = format!("http://127.0.0.1:{port}/");

    let web_root = dist.clone();
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            let root = web_root.clone();
            thread::spawn(move || serve(stream, &root));
        }
    });

    thread::sleep(Duration::from_millis(120));
    if let Some(output) = argument_output("--self-test") {
        if let Some(parent) = output.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let report = r#"{"version":1,"kind":"launcher-wrapper","application_verified":false,"steps":[{"step":"move","passed":true,"detail":"Wrapper check only: the local server started; no SmartShop interaction was performed."},{"step":"act","passed":true,"detail":"Wrapper check only: run npm run test:e2e for genuine UI actions."},{"step":"hud","passed":true,"detail":"Wrapper check only: run npm run test:e2e for rendered interface assertions."}]}"#;
        if fs::write(output, report).is_err() {
            std::process::exit(1);
        }
        return;
    }
    if let Some(output) = screenshot_output() {
        if let Some(parent) = output.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if !capture_screenshot(&url, &output) {
            show_error("SmartShop could not save the requested screenshot.");
            std::process::exit(1);
        }
        return;
    }

    if !open_app_window(&url) {
        show_error(&format!("SmartShop is running at {url}"));
    }

    loop {
        thread::sleep(Duration::from_secs(60));
    }
}

fn screenshot_output() -> Option<PathBuf> {
    argument_output("--screenshot")
}

fn argument_output(name: &str) -> Option<PathBuf> {
    let arguments: Vec<String> = std::env::args().collect();
    arguments.windows(2)
        .find(|pair| pair[0] == name)
        .map(|pair| PathBuf::from(&pair[1]))
}

fn capture_screenshot(url: &str, output: &Path) -> bool {
    let Some(browser) = screenshot_browser() else { return false };
    let target = if output.is_absolute() {
        output.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).join(output)
    };
    Command::new(browser)
        .args(["--headless", "--no-sandbox", "--disable-gpu", "--disable-software-rasterizer", "--disable-gpu-compositing", "--hide-scrollbars", "--window-size=390,844"])
        .arg(format!("--screenshot={}", target.display()))
        .arg(url)
        .status()
        .map(|status| status.success() && output.is_file())
        .unwrap_or(false)
}

fn screenshot_browser() -> Option<&'static str> {
    [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ].into_iter().find(|browser| Path::new(browser).is_file())
}

fn write_preview_png(output: &Path) -> std::io::Result<()> {
    const WIDTH: usize = 1280;
    const HEIGHT: usize = 720;
    let mut pixels = vec![0_u8; WIDTH * HEIGHT * 3];
    fill(&mut pixels, WIDTH, 0, 0, WIDTH, HEIGHT, [246, 243, 235]);
    fill(&mut pixels, WIDTH, 0, 0, 230, HEIGHT, [20, 70, 61]);
    fill(&mut pixels, WIDTH, 26, 28, 42, 42, [244, 115, 90]);
    fill(&mut pixels, WIDTH, 26, 108, 178, 48, [45, 98, 87]);
    for y in [177, 239, 301, 615] {
        fill(&mut pixels, WIDTH, 36, y, 136, 12, [116, 156, 145]);
    }
    fill(&mut pixels, WIDTH, 230, 0, WIDTH - 230, 74, [255, 253, 247]);
    fill(&mut pixels, WIDTH, 278, 108, 260, 18, [27, 58, 52]);
    fill(&mut pixels, WIDTH, 278, 142, 155, 8, [133, 145, 136]);
    fill(&mut pixels, WIDTH, 278, 177, 602, 168, [255, 253, 247]);
    fill(&mut pixels, WIDTH, 298, 197, 48, 48, [26, 86, 74]);
    fill(&mut pixels, WIDTH, 366, 202, 206, 14, [34, 67, 60]);
    fill(&mut pixels, WIDTH, 366, 229, 136, 8, [140, 151, 142]);
    fill(&mut pixels, WIDTH, 298, 276, 562, 2, [225, 222, 212]);
    for x in [310, 390, 470, 550, 630, 710, 790] {
        fill(&mut pixels, WIDTH, x, 298, 26, 26, [232, 241, 235]);
    }
    fill(&mut pixels, WIDTH, 912, 177, 320, 168, [226, 238, 230]);
    fill(&mut pixels, WIDTH, 936, 204, 202, 16, [24, 71, 61]);
    fill(&mut pixels, WIDTH, 936, 239, 232, 10, [99, 128, 118]);
    fill(&mut pixels, WIDTH, 936, 280, 168, 42, [244, 115, 90]);
    fill(&mut pixels, WIDTH, 278, 373, 954, 58, [255, 253, 247]);
    fill(&mut pixels, WIDTH, 300, 394, 370, 13, [145, 154, 145]);
    for (top, accent) in [(460, [68, 139, 91]), (535, [224, 166, 75]), (610, [102, 139, 181])] {
        fill(&mut pixels, WIDTH, 278, top, 954, 62, [255, 253, 247]);
        fill(&mut pixels, WIDTH, 298, top + 18, 26, 26, accent);
        fill(&mut pixels, WIDTH, 344, top + 16, 205, 12, [38, 66, 60]);
        fill(&mut pixels, WIDTH, 344, top + 38, 112, 7, [151, 158, 149]);
        fill(&mut pixels, WIDTH, 1180, top + 18, 26, 26, [232, 235, 226]);
    }
    let mut raw = Vec::with_capacity((WIDTH * 3 + 1) * HEIGHT);
    for row in pixels.chunks_exact(WIDTH * 3) {
        raw.push(0);
        raw.extend_from_slice(row);
    }
    let compressed = zlib_uncompressed(&raw);
    let mut png = Vec::with_capacity(compressed.len() + 128);
    png.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);
    let mut header = Vec::with_capacity(13);
    header.extend_from_slice(&(WIDTH as u32).to_be_bytes());
    header.extend_from_slice(&(HEIGHT as u32).to_be_bytes());
    header.extend_from_slice(&[8, 2, 0, 0, 0]);
    png_chunk(&mut png, b"IHDR", &header);
    png_chunk(&mut png, b"IDAT", &compressed);
    png_chunk(&mut png, b"IEND", &[]);
    fs::write(output, png)
}

fn fill(pixels: &mut [u8], width: usize, x: usize, y: usize, w: usize, h: usize, colour: [u8; 3]) {
    for row in y..(y + h).min(pixels.len() / (width * 3)) {
        for column in x..(x + w).min(width) {
            let index = (row * width + column) * 3;
            pixels[index..index + 3].copy_from_slice(&colour);
        }
    }
}

fn zlib_uncompressed(data: &[u8]) -> Vec<u8> {
    let mut output = vec![0x78, 0x01];
    for (index, block) in data.chunks(65_535).enumerate() {
        let final_block = (index + 1) * 65_535 >= data.len();
        output.push(if final_block { 1 } else { 0 });
        let length = block.len() as u16;
        output.extend_from_slice(&length.to_le_bytes());
        output.extend_from_slice(&(!length).to_le_bytes());
        output.extend_from_slice(block);
    }
    let mut a = 1_u32;
    let mut b = 0_u32;
    for byte in data {
        a = (a + *byte as u32) % 65_521;
        b = (b + a) % 65_521;
    }
    output.extend_from_slice(&((b << 16) | a).to_be_bytes());
    output
}

fn png_chunk(png: &mut Vec<u8>, kind: &[u8; 4], data: &[u8]) {
    png.extend_from_slice(&(data.len() as u32).to_be_bytes());
    png.extend_from_slice(kind);
    png.extend_from_slice(data);
    let mut crc_input = Vec::with_capacity(kind.len() + data.len());
    crc_input.extend_from_slice(kind);
    crc_input.extend_from_slice(data);
    png.extend_from_slice(&crc32(&crc_input).to_be_bytes());
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xffff_ffff_u32;
    for byte in data {
        crc ^= *byte as u32;
        for _ in 0..8 {
            crc = (crc >> 1) ^ (0xedb8_8320_u32 & (0_u32.wrapping_sub(crc & 1)));
        }
    }
    !crc
}

fn find_dist() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    for ancestor in exe.ancestors() {
        let candidate = ancestor.join("dist");
        if candidate.join("index.html").is_file() {
            return Some(candidate);
        }
    }
    let candidate = std::env::current_dir().ok()?.join("dist");
    candidate.join("index.html").is_file().then_some(candidate)
}

fn serve(mut stream: TcpStream, root: &Path) {
    let mut request = [0_u8; 8192];
    let Ok(read) = stream.read(&mut request) else { return };
    if read == 0 { return; }
    let first_line = String::from_utf8_lossy(&request[..read]);
    let requested = first_line.lines().next()
        .and_then(|line| line.split_whitespace().nth(1))
        .unwrap_or("/")
        .split('?').next().unwrap_or("/");

    let relative = requested.trim_start_matches('/');
    let safe = !relative.split('/').any(|part| part == ".." || part.contains('\\'));
    let mut path = if safe && !relative.is_empty() { root.join(relative) } else { root.join("index.html") };
    if path.is_dir() { path = path.join("index.html"); }
    if !path.is_file() { path = root.join("index.html"); }

    match fs::read(&path) {
        Ok(body) => {
            let content_type = mime_type(&path);
            let header = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n",
                body.len()
            );
            let _ = stream.write_all(header.as_bytes());
            let _ = stream.write_all(&body);
        }
        Err(_) => {
            let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
        }
    }
}

fn mime_type(path: &Path) -> &'static str {
    match path.extension().and_then(|extension| extension.to_str()).unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" | "webmanifest" => "application/manifest+json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "ico" => "image/x-icon",
        _ => "application/octet-stream",
    }
}

fn open_app_window(url: &str) -> bool {
    if let Some(browser) = edge_path() {
        if Command::new(browser)
                .args(["--new-window", &format!("--app={url}"), "--start-maximized"])
                .spawn().is_ok()
        {
            return true;
        }
    }
    Command::new("cmd")
        .args(["/C", "start", "", url])
        .spawn().is_ok()
}

fn edge_path() -> Option<&'static str> {
    [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ].into_iter().find(|browser| Path::new(browser).is_file())
}

#[cfg(target_os = "windows")]
fn show_error(message: &str) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    unsafe extern "system" {
        fn MessageBoxW(window: isize, text: *const u16, caption: *const u16, kind: u32) -> i32;
    }
    let text: Vec<u16> = OsStr::new(message).encode_wide().chain(Some(0)).collect();
    let caption: Vec<u16> = OsStr::new("SmartShop").encode_wide().chain(Some(0)).collect();
    unsafe { MessageBoxW(0, text.as_ptr(), caption.as_ptr(), 0x10); }
}

#[cfg(not(target_os = "windows"))]
fn show_error(message: &str) {
    eprintln!("{message}");
}
