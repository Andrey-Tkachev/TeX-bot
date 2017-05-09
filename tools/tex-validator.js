function isValidTeX(data) {
  if (data == '') {
    return false;
  }
  // Test brackets sqequence
  var brackets_stack = new Array();
  var open_brackets = new Array('(', 
                                '[',
                                '{');
  var close_brackets = new Array( ')',
                                  ']',
                                  '}');
  for (var i=0; i != data.length; i++) {
    var stack_size = brackets_stack.length;
    var br = data[i];
    
    if (open_brackets.indexOf(br) != -1) {
      brackets_stack.push(data[i]);
    } else if (close_brackets.indexOf(br) != -1) {
      var this_type = close_brackets.indexOf(data[i]);
      if (stack_size != 0) {
        var last_opening = brackets_stack.pop();
        var last_opening_type = open_brackets.indexOf(last_opening);
        if (last_opening_type != this_type) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  return (brackets_stack.length == 0);
}

console.log(isValidTeX('[asd]}'));
module.exports.isValidTeX = isValidTeX;
