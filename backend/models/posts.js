const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    title: String,
    post_id: String,
    location: String,
    image_id: String,
    saved: Boolean
});

module.exports = mongoose.model('Post', schema);