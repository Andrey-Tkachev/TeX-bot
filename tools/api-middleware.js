function inlineObjectFactory(_id, _type) {
  return {
    type: _type,
    id: _id
  }
}

function inlinePhotoFactory(id, photo_url, thumb_url, sizes) {
  var inline_obj = inlineObjectFactory(id, 'photo');
  inline_obj.photo_url = photo_url;
  inline_obj.thumb_url = thumb_url;
  inline_obj.photo_width = sizes.width;
  inline_obj.photo_height = sizes.height;
  return inline_obj;
}

function inlineArticleFactory(id, title, content) {
  var inline_obj = inlineObjectFactory(id, 'article');
  inline_obj.title = title;
  inline_obj.input_message_content = { message_text : content };
  return inline_obj;
}

module.exports.inlineObjectFactory = inlineObjectFactory;
module.exports.inlinePhotoFactory = inlinePhotoFactory;
module.exports.inlineArticleFactory = inlineArticleFactory;