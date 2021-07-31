var messages = [];
var tpl_message = '<div class="message {{me}}"><div class="lines">{{#lines}}<div class="line">{{{.}}}</div>{{/lines}}</div><div class="meta"><div class="username">{{username}}</div><div class="timestamp">{{timestamp}}</div></div></div>';

$(function() {
  $chat = $('#chat');

  var message;
  $.get("WhatsApp_Chat.txt", function( data ) {
		data = data.replace(/\u200E/g, ""); // Left-To-Right Mark

    var lines = data.split(/(\n|\r)/);
		
    var c = 0;
    $.each(lines, function(n) {
      var line = lines[n].replace(/(\r\n|\n|\r)/gm, "").trim();
      
      if(line.length == 0) {return;}  

      var newMessage = /^\[[0-9]{2}\.[0-9]{2}\.[0-9]{2}, [0-9]{2}:[0-9]{2}:[0-9]{2}.*/.test(line);

      if(newMessage && message) {
        messages.push(message);       
      }
      
      if(newMessage) {
        message = {};
        message.lines = []; 
        // Timestamp
        var tmpTimestamp = line.match(/^\[([0-9]{2}\.[0-9]{2}\.[0-9]{2}, [0-9]{2}:[0-9]{2}:[0-9]{2})\]/);
        if(tmpTimestamp) {
          message.timestamp = tmpTimestamp[1];
        }          
      }
      
      // Special Chars
      line = line.replace(/</g, '&lt;');
      
      // Media
      line = line.replace(/([a-zA-Z0-9-]+\.jpg)\ &lt;angeh�ngt>/g, '<div class="media"><a href="media/$1" target="blank"><img src="media/$1" /></a></div>');
      line = line.replace(/\&lt;Anhang: ([a-zA-Z0-9-]+\.jpg)\>/g, '<div class="media"><a href="media/$1" target="blank"><img src="media/$1" /></a></div>');

      // Username
      var tmpUsername = line.match(/^\[[0-9]{2}\.[0-9]{2}\.[0-9]{2}, [0-9]{2}:[0-9]{2}:[0-9]{2}\] (.+?):/);
      if(tmpUsername) {
        message.username = tmpUsername[1];
        message.me = (myNames.indexOf(tmpUsername[1]) > -1) ? "me" : "";
      }
      
      // Message      
      var tmpMessage = line.match(/^\[[0-9]{2}\.[0-9]{2}\.[0-9]{2}, [0-9]{2}:[0-9]{2}:[0-9]{2}\] .+?: (.*)/);
      if(tmpMessage) {
        // First Line of message with meta
        message.lines.push(tmpMessage[1]);
      }else{
        // following lines without meta
        message.lines.push(line);
      }
      
    });

    // Add Last Message
    messages.push(message); 
    
    // Print
		$('.pagination').pagination({
			dataSource: messages,
			pageSize: perPage,
			pageNumber: Math.ceil(messages.length/perPage),
			autoHidePrevious: true,
			autoHideNext: true,
			callback: function(data, pagination) {
				$chat.empty();
				$.each(data, function(n) {
					var output = Mustache.render(tpl_message, data[n]);
					$chat.append(output);
					replaceEmojiWithImages($chat.get(0));
				});
			}
		})
			
    
  });
  

  window.addEventListener('wheel', function(e) {
        console.log(e.deltaY);
    if(!e.shiftKey) {
      return;
    }
    if(e.deltaY / 120 < 0) {
      $('.pagination').pagination('previous');
    } else {
      $('.pagination').pagination('next');
    }
  })
	
	$(window).keydown(function(e) {
		if(e.shiftKey) {
      return;
    }
		console.log(e.which)
    switch(e.which) {
      case 37: 
      $('.pagination').pagination('previous');
      break;

      case 39:
      $('.pagination').pagination('next');
      break;

      default: return; // exit this handler for other keys
    }
  });
  
  
});


/*= Emoji
------------------------ */
function replaceEmojiWithImages(root) { 

  root = root || document.body;

  var REGIONAL_INDICATOR_A = parseInt("1f1e6", 16),
      REGIONAL_INDICATOR_Z = parseInt("1f1ff", 16),
      IMAGE_HOST = "my-azur.de",
      IMAGE_PATH = "/load/other/emoji/unicode/",
      IMAGE_EXT = ".png";
 
  // String.fromCodePoint is super helpful
  if (!String.fromCodePoint) {
    /*!
     * ES6 Unicode Shims 0.1
     * (c) 2012 Steven Levithan <http://slevithan.com/>
     * MIT License
     **/
    String.fromCodePoint = function fromCodePoint () {
      var chars = [], point, offset, units, i;
      for (i = 0; i < arguments.length; ++i) {
        point = arguments[i];
        offset = point - 0x10000;
        units = point > 0xFFFF ? [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)] : [point];
        chars.push(String.fromCharCode.apply(null, units));
      }
      return chars.join("");
    }
  }
 
  /**
   * Create a treewalker to walk an element and return an Array of Text Nodes.
   * This function is (hopefully) smart enough to exclude unwanted text nodes
   * like whitespace and script tags.
   * https://gist.github.com/mwunsch/4693383
   */
  function getLegitTextNodes(element) {
    if (!document.createTreeWalker) return [];
 
    var blacklist = ['SCRIPT', 'OPTION', 'TEXTAREA'],
        textNodes = [],
        walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            function excludeBlacklistedNodes(node) {
              if (blacklist.indexOf(node.parentElement.nodeName.toUpperCase()) >= 0) return NodeFilter.FILTER_REJECT;
              if (String.prototype.trim && !node.nodeValue.trim().length) return NodeFilter.FILTER_SKIP;
              return NodeFilter.FILTER_ACCEPT;
            },
            false
        );
 
    while(walker.nextNode()) textNodes.push(walker.currentNode);
 
    return textNodes;
  }
 
  /**
   * Determine if this browser supports emoji.
   */
  function doesSupportEmoji() {
    var context, smiley;
    if (!document.createElement('canvas').getContext) return;
    context = document.createElement('canvas').getContext('2d');
    if (typeof context.fillText != 'function') return;
    smile = String.fromCodePoint(0x1F604); // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)
 
    context.textBaseline = "top";
    context.font = "32px Arial";
    context.fillText(smile, 0, 0);
    return context.getImageData(16, 16, 1, 1).data[0] !== 0;
  }
 
  /**
   * For a UTF-16 (JavaScript's preferred encoding...kinda) surrogate pair,
   * return a Unicode codepoint.
   */
  function surrogatePairToCodepoint(lead, trail) {
    return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
  }
 
  /**
   * Get an Image element for an emoji codepoint (in hex).
   */
  function getImageForCodepoint(hex) {
    var img = document.createElement('IMG');
 
    img.style.width = "1.4em";
    img.style.verticalAlign = "top";
    img.src = "//" + IMAGE_HOST + IMAGE_PATH + hex + IMAGE_EXT;
 
    return img;
  }
 
  /**
   * Convert an HTML string into a DocumentFragment, for insertion into the dom.
   */
  function fragmentForString(htmlString) {
    var tmpDoc = document.createElement('DIV'),
        fragment = document.createDocumentFragment(),
        childNode;
 
    tmpDoc.innerHTML = htmlString;
 
    while(childNode = tmpDoc.firstChild) {
      fragment.appendChild(childNode);
    }
    return fragment;
  }
 
  /**
   * Iterate through a list of nodes, find emoji, replace with images.
   */
  function emojiReplace(nodes) {
    var PATTERN = /([\ud800-\udbff])([\udc00-\udfff])/g;
 
    nodes.forEach(function (node) {
      var replacement,
          value = node.nodeValue,
          matches = value.match(PATTERN);
 
      if (matches) {
        replacement = value.replace(PATTERN, function (match, p1, p2) {
          var codepoint = surrogatePairToCodepoint(p1.charCodeAt(0), p2.charCodeAt(0)),
              img = getImageForCodepoint(codepoint.toString(16));
          return img.outerHTML;
        });
 
        node.parentNode.replaceChild(fragmentForString(replacement), node);
      }
    });
  }
 
  // Call everything we've defined
  if (!doesSupportEmoji()) {
    emojiReplace(getLegitTextNodes(root));
  }
 
}