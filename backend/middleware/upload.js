const multer = require("multer");
const {
    GridFsStorage
} = require("multer-gridfs-storage");

const storage = new GridFsStorage({
    url: "mongodb+srv://ceydapatan:Erdemzeynep123@cluster0.gsjulaa.mongodb.net/?retryWrites=true&w=majority",
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const match = ["image/png", "image/jpeg"];

        if (match.indexOf(file.mimetype) === -1) {
            console.log('file.mimetype === -1')
            return `${Date.now()}-jf-${file.originalname}`;
        }
        console.log('store');
        return {
            bucketName: 'posts',
            filename: `${Date.now()}-jf-${file.originalname}`,
        };
    },
});

module.exports = multer({ storage });