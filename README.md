# Online Toolkit 🛠️

A modern, beautiful collection of free online tools for file format conversion and utilities. All processing happens locally in your browser - your files never leave your device!

## ✨ Features

### 🖼️ Image Tools
- **Image Converter** - Convert between JPG, PNG, WebP, GIF, and BMP formats
- **Image Resizer** - Resize and compress images with aspect ratio control
- **Image Cropper** - Crop images to custom dimensions with visual selection

### 🎬 Video Tools
- **Video Info** - Get detailed information about video files (duration, dimensions, bitrate)
- **Video Thumbnail** - Extract thumbnail images from any point in a video

### 🎵 Audio Tools
- **Audio Info** - View audio file metadata and properties
- **Audio Trimmer** - Trim and cut audio files with visual timeline

### 🔧 Utility Tools
- **QR Code Generator** - Generate QR codes from text or URLs
- **Color Picker** - Extract colors from images and get HEX, RGB, and HSL codes
- **Text Tools** - Case converter, word counter, character counter, and more
- **Base64 Encoder/Decoder** - Encode and decode Base64 strings

## 🚀 Getting Started

This is a pure JavaScript application with no build step required!

### Option 1: Open Directly
Simply open `index.html` in your web browser. That's it!

### Option 2: Use a Local Server
For the best experience, serve the files using a local web server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

**Using VS Code Live Server:**
- Install the "Live Server" extension
- Right-click on `index.html`
- Select "Open with Live Server"

## 🎨 Features

- **🌓 Dark/Light Mode** - Toggle between themes with the theme switcher
- **📱 Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- **🔒 100% Private** - All processing happens in your browser
- **⚡ Lightning Fast** - No server uploads or downloads
- **💯 Free Forever** - No ads, no tracking, no sign-up required
- **🎯 Drag & Drop** - Easy file uploading with drag and drop support

## 💻 Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables and animations
- **Vanilla JavaScript** - No frameworks or dependencies
- **Canvas API** - Image processing and manipulation
- **Web Audio API** - Audio file handling
- **File API** - Client-side file processing

## 🌐 Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- File API
- ES6+ JavaScript
- CSS Grid and Flexbox

Recommended browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 📁 Project Structure

```
online-toolkit/
├── index.html          # Main HTML file
├── styles.css          # All styling and themes
├── app.js             # Main application logic and all tools
└── README.md          # This file
```

## 🎯 Usage Examples

### Converting an Image
1. Click on "Image Converter" tool
2. Upload or drag & drop your image
3. Select the output format
4. Adjust quality (for JPEG/WebP)
5. Click "Convert Image"
6. Download the result!

### Generating a QR Code
1. Click on "QR Code Generator"
2. Enter your text or URL
3. Select the size
4. Click "Generate QR Code"
5. Download the QR code image!

### Picking Colors from Images
1. Click on "Color Picker"
2. Upload an image
3. Click anywhere on the image
4. Get HEX, RGB, and HSL codes
5. Copy the color code with one click!

## 🔐 Privacy & Security

- **No server uploads** - Files are processed entirely in your browser
- **No data collection** - We don't track, store, or analyze any data
- **No cookies** - Only localStorage for theme preference
- **Open source** - All code is visible and auditable

## 🎨 Customization

You can easily customize the look and feel by editing the CSS variables in `styles.css`:

```css
:root {
    --primary: #6366f1;        /* Primary color */
    --secondary: #ec4899;      /* Secondary color */
    --bg-primary: #ffffff;     /* Background color */
    /* ... and more */
}
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new tools
- Improve existing tools
- Fix bugs
- Enhance the UI/UX
- Update documentation

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🌟 Future Tools

Planned additions:
- PDF tools (merge, split, compress)
- Video compressor
- Batch image converter
- SVG optimizer
- JSON formatter
- Markdown preview
- Hash generator
- URL shortener
- And more!

## 💡 Tips

- Use keyboard shortcut `ESC` to close any tool modal
- Drag and drop files for faster uploads
- Toggle dark mode for comfortable nighttime use
- All tools preserve the original file - nothing is lost
- Check your browser console for any error messages

## 📧 Support

If you encounter any issues or have suggestions, please open an issue on the repository.

---

Made with ❤️ for the web community. Enjoy your free online toolkit!