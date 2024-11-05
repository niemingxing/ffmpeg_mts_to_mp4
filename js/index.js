document.addEventListener('DOMContentLoaded', async function() {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });
    ffmpeg.setProgress(({ ratio }) => {
        const percentage = Math.round(ratio * 100);
        console.log(`转换进度: ${percentage}%`);
        // 更新进度条
        progressBarFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
        if (percentage >= 100) {
            convertBtn.classList.add('hidden');
            progressBar.classList.add('hidden');
            progressText.textContent = '转换完成！';
            downloadBtn.classList.remove('hidden');
            downloadBtn.innerHTML = '请稍后...';
        }
    });
    // Load FFmpeg.js
    await ffmpeg.load();

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressBarFill = progressBar.querySelector('.bg-blue-600');
    const progressText = document.getElementById('progressText');

    let currentFile = null;

    //dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    // fileInput.addEventListener('input', handleFileSelect);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) handleFile(files[0]);
    }

    function handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.mts')) {
            alert('请上传 .mts 格式的文件');
            return;
        }
        if (file.size > 524288000) {
            alert('文件大小超过 500MB 限制');
            return;
        }
        currentFile = file;
        fileName.textContent = file.name;
        fileName.classList.remove('hidden');
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('bg-gray-50');
        uploadBtn.classList.add('bg-blue-500', 'text-white');
    }

    uploadBtn.addEventListener('click', function() {
        if (!currentFile) {
            alert('请先选择文件');
            return;
        }
        uploadBtn.disabled = true;
        uploadBtn.textContent = '上传中...';

        setTimeout(() => {
            uploadBtn.classList.add('hidden');
            convertBtn.classList.remove('hidden');
        }, 1500);
    });

    convertBtn.addEventListener('click', async function() {
        if (!currentFile) return;
        convertBtn.disabled = true;
        progressBar.classList.remove('hidden');

        // Write the uploaded file to FFmpeg's filesystem
        ffmpeg.FS('writeFile', 'input.mts', await fetchFile(currentFile));
        let progress = 0;
        // Run the conversion
        await ffmpeg.run('-i', 'input.mts', '-c:v', 'libx264', '-c:a', 'copy', '-f', 'mp4', 'output.mp4');

        // Read the result file
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        let fileName = currentFile.name;
        let index = fileName.lastIndexOf(".");
        let suffix = fileName.substring(index);
        let newFileName = fileName.replace(suffix, ".mp4");
        downloadBtn.download = newFileName;
        downloadBtn.innerHTML = '立即下载 MP4';
    });
});