let form = document.getElementById('upload-form');
let message = document.getElementById('upload-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let data = new FormData(form);
    message.textContent = "";

    try {
        let response = await fetch('/upload', {
            method: 'POST',
            body: data
        });
        if (response.ok) {
            message.textContent = "File Uploaded";
        }
        else {
            message.textContent = "Upload Failed";
        }
    }
    catch (error) {
        console.error(error);
        message.textContent = "Error Uploading File";

    }
});