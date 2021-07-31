const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));

var app = new Vue({
	el: '#app',
	data: function() {
		return {
			messages: [],
			perPage: perPage,
			currentPage: 1,
			navNum: 2,
			stats: null
		}
	},
	mounted: function() {
		var that = this;
		axios.get('WhatsApp_Chat.txt')
		.then(function (res) {
			//console.log(res.data);
			var data = res.data;
			data = data.replace(/\u200E/g, ""); // Left-To-Right Mark

			var lines = data.split(/(\n|\r)/);

			//lines = lines.slice(0, 200)

			var message;
			lines.forEach(function(line) {
				line = line.replace(/(\r\n|\n|\r)/gm, "").trim();
				if(line.length == 0) { return; } 
				var newMessage = /^\[[0-9]{2}\.[0-9]{2}\.[0-9]{2}, [0-9]{2}:[0-9]{2}:[0-9]{2}.*/.test(line);

				if(newMessage && message) {
					that.messages.push(message);       
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
					message.me = (myNames.indexOf(tmpUsername[1]) > -1);
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
			that.messages.push(message); 

			if(jumpToLastPage) {
				that.currentPage = that.pageCount
			}

		})
		.catch(function (error) {
			// handle error
			console.log(error);
		})


		window.addEventListener('wheel', function(e) {
			if(!e.shiftKey) {
				return;
			}
			if(e.deltaY / 120 < 0) {
				that.pageChangeHandle('previous');
			} else {
				that.pageChangeHandle('next');
			}
		})

		window.addEventListener('keydown', function(e) {
			if(e.shiftKey) {
				return;
			}
			console.log(e.which)
			switch(e.which) {
				case 37: 
					that.pageChangeHandle('previous');
				break;

				case 39:
					that.pageChangeHandle('next');
				break;

				default: return; // exit this handler for other keys
			}
		});

	},
	methods: {
		paginationCallback: function(page) {
      console.log(`Page  was selected. Do something about it`);
    },
		pageChangeHandle(value) {
      switch (value) {
        case 'next':
					if(this.currentPage + 1 <= this.pageCount) {
         	 this.currentPage += 1
					}
          break
        case 'previous':
					if(this.currentPage - 1 > 0) {
         	 this.currentPage -= 1
					}
          break
        default:
					if(value > 0 && value <= this.pageCount) {
          	this.currentPage = value
					}
      }
		},
		showAll() {
			if(confirm("Achtung! Diese Aktion ist bei großer Anzahl Nachrichten sehr CPU intensiv und kann in seltenen Fällen als Nebenwirkung ein schwarzes Loch erzeugen.")) {
				this.perPage = -1
			}
		}
	},
	computed: {
		messagesCount() {
			return this.messages.length
		},
		pageCount() {
			return Math.ceil(this.messagesCount / this.perPage)
		},
		pagedMessages() {
			if(this.perPage == -1) { return this.messages; }
			var end = this.currentPage*this.perPage;
			var start = end-this.perPage;

			return this.messages.slice(start, end)
		},
		firstMessageDate() {
			return parseWhatsAppDate(this.messages[0].timestamp);
		},
		lastMessageDate() {
			return parseWhatsAppDate(this.messages[this.messages.length-1].timestamp);
		},
		timespan() {
			var timespanMin = this.lastMessageDate.getTime() - this.firstMessageDate.getTime();
			var timespanHours = timespanMin / (1000 * 3600 * 24);
			return Math.round(timespanHours)
		}
	},
	filters: {
		formatDate(value) {
			return value.toLocaleDateString(undefined, {year: 'numeric', month: '2-digit', day: '2-digit',  })
		}
	}
});


function parseWhatsAppDate(dateString) {
	var d = dateString.match(/^(\d+).(\d+).(\d+), (\d+):(\d+):(\d+)/)
	d.shift()
	d= d.map(function (elm) {
		return parseInt(elm)
	})
	d = new Date(2000+d[2], d[1]-1, d[0], d[3], d[4], d[5])
	return d;
}