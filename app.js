var messages = [];
var tpl_message = '<div class="message {{me}}"><div class="lines">{{#lines}}<div class="line">{{{.}}}</div>{{/lines}}</div><div class="meta"><div class="username">{{username}}</div><div class="timestamp">{{timestamp}}</div></div></div>';
var pageination;
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
			autoHidePrevious: true,
			autoHideNext: true,
			callback: function(data, pagination) {
				$chat.empty();
				$.each(data, function(n) {
					var output = Mustache.render(tpl_message, data[n]);
					$chat.append(output);
				});
			}
		})
			
    
  });
  

  window.addEventListener('wheel', function(e) {
        console.log(e.deltaY);
    if(!e.shiftKey) {
      return;
    }
    if(e.deltaY / 120 > 0) {
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