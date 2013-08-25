var Calendar;



(function (){
var t = {
	getStyle: function ( elem, name ) {
		if (elem.style[name]) {
			return elem.style[name];
		} else if (document.defaultView && document.defaultView.getComputedStyle) {
			name = name.replace(/([A-Z])/g,"-$1");
			name = name.toLowerCase();
			var s = document.defaultView.getComputedStyle(elem,"");
			return s && s.getPropertyValue(name);
		} else if (elem.currentStyle) {
			console.log(elem.currentStyle[name]);
			return elem.currentStyle[name];
		} else {
			return null;
		}
	},

	getHeight: function getHeight( elem ) {
		return parseInt( this.getStyle( elem, 'height' ), 10 );
	},

	getWidth: function getWidth( elem ) {
		return parseInt( this.getStyle( elem, 'width' ), 10 );
	},
	
	pageX: function (elem) {
		var p = 0;
		while ( elem.offsetParent ) {
			p += elem.offsetLeft;
			elem = elem.offsetParent;
		}
		return p;
	},

	pageY: function (elem) {
		var p = 0;
		while ( elem.offsetParent ) {
			p += elem.offsetTop;
			elem = elem.offsetParent;
		}
		return p;
	},
	
	setX: function (elem, pos) {
		elem.style.left = pos + "px";
	},

	setY: function (elem, pos) {
		elem.style.top = pos + "px";
	},
	
	changeClass: function (el, a, b) {
		var regA = new RegExp("(?:\\s{2,})?\\b" + a + "\\b(?:\\s{2,})?", 'g'),
			regB = new RegExp("\\b" + b + "\\b", 'g');
		el.className = el.className.replace(regA, "");
		if (!regB.test(el.className)) {
			el.className = (el.className + " " + b);
		}
		el.className = el.className.replace(/^\s*|\s$/g, "");
	},
	
	ev: {
		addEvent: function (element, type, handler) {
			if (document.addEventListener) { // W3C
				element.addEventListener(type, handler, false);
			} else if (document.attachEvent) { // IE
				element.attachEvent('on' + type, handler);
			} else { // крайний случай
				element.onclick = myHandler;
			}
		},
		fixEvent: function (event) {
			event.preventDefault = function() {
				this.returnValue = false;
			};
			event.stopPropagation = function() {
				this.cancelBubble = true;
			};
			return event;
		},
		stopBubbling: function (event) {
			// предотвратить дальнейшее всплытие события
				event.stopPropagation();
			// предотвратить выполнение действия по умолчанию
				event.preventDefault();
		}
	}
};

Calendar = function () {
	var that = this;
	_init();
	
	function _init() {
		that.cal = document.getElementById('calendar');
		that.form = {};
		that.form.self = document.querySelector('#form');
			that.form.hide = function () {
				var f = that.form;
				t.setY(this.self, -1000);
				t.changeClass(this.self, "", "hidden");
				f.fEvNameEl.value = '';
				f.fEvDateEl.value = '';
				f.fEvContactEl.value = '';
				f.fEvDescriptionEl.value = '';
				that.drawMonth();
			};
			that.form.fEvNameEl = that.form.self.querySelector("input[name=event]");
			that.form.fEvDateEl = that.form.self.querySelector("input[name=date]");
			that.form.fEvContactEl = that.form.self.querySelector("input[name=contacts]");
			that.form.fEvDescriptionEl = that.form.self.querySelector("textarea[name=descriptions]");
			that.form.fEvDoneEl = that.form.self.querySelector("button[name=done]");
			that.form.fEvDeleteEl = that.form.self.querySelector("button[name=delete]");
		that.dateTitleEl = document.getElementById('monthNameAndYear');
		that.event.store = (window.localStorage && window.localStorage.eventStorage && 
					JSON.parse(window.localStorage.eventStorage)) || {};
		
		that.currentDate = new Date();
		that.drawTitle();
		that.drawMonth();
		t.ev.addEvent(document.getElementById("prev"), 'click', function (e) {
			that.form.hide();
			that.changeMonth(-1);
			that.drawTitle();
			that.drawMonth();
		});

		t.ev.addEvent(document.getElementById("next"), 'click', function (e) {
			that.form.hide();
			that.changeMonth(1);
			that.drawTitle();
			that.drawMonth();
		});

		t.ev.addEvent(that.cal, 'click', function (e) {
			e = e || t.ev.fixEvent(e);
			var el = e.target || e.srcElement,
				f = that.form,
				wCal = t.getWidth(that.cal),
				key, event, eventName,
				contact, desription,
				x, y, d;
			
			while ( !(/\bday\b/.test(el.className) || /\bday_event\b/.test(el.className) ) ) {
				if (el === this) {
					return false;
				}
				el = el.parentNode;
			}
			if (/\bday_event\b/.test(el.className)) {
				event = el;
				el = el.parentNode;
			}
			
			d = new Date(parseInt(el.getAttribute("name"), 10));
			f.date = d;
			key = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
			
			if (event) {
				eventName = encodeURIComponent(event.querySelector('div.eventName').innerHTML);
				if (that.event.store[key][eventName]) {
					f.fEvNameEl.value = decodeURIComponent(eventName);
					f.fEvContactEl.value = decodeURIComponent(that.event.store[key][eventName].contact);
					f.fEvDescriptionEl.value = decodeURIComponent(that.event.store[key][eventName].description);
				}
				
			}
			x = t.pageX(el);
			y = t.pageY(el);
			t.changeClass(f.self, "hidden", "");
			if (x < wCal / 2) {
				t.changeClass(f.self, "right", "left");
				t.setX(f.self, x + t.getWidth(el) + 10);
				t.setY(f.self, y);
			} else {
				t.changeClass(f.self, "left", "right");
				t.setX(f.self, x - t.getWidth(f.self) - 10);
				t.setY(f.self, y);
			}
			f.fEvDateEl.value = d.getDate() + ", " + that.months[d.getMonth()] + ", " + d.getFullYear();
		});

		t.ev.addEvent(document.getElementById("formClose"), 'click', function (e) {
			e = e || t.ev.fixEvent(e);
			var f = that.form;
			
			f.hide();
			t.ev.stopBubbling(e);
		});

		t.ev.addEvent(that.form.fEvDoneEl, 'click', function (e) {
			e = e || t.ev.fixEvent(e);
			var f = that.form,
				date = f.date,
				eventName = encodeURIComponent(f.fEvNameEl.value),
				contact = encodeURIComponent(f.fEvContactEl.value),
				description = encodeURIComponent(f.fEvDescriptionEl.value);
			
			t.ev.stopBubbling(e);
			
			if (f.fEvNameEl.value === '') {
				alert("Вам нужно ввести название события");
				return;
			}
			
			that.event.save(date, eventName, contact, description);
			
			f.hide();
		});
		
		t.ev.addEvent(that.form.fEvDeleteEl, 'click', function (e) {
			e = e || t.ev.fixEvent(e);
			var f = that.form,
				date = f.date,
				eventName = encodeURIComponent(f.fEvNameEl.value);
			
			t.ev.stopBubbling(e);
			
			if (f.fEvNameEl.value === '') {
				alert("Вам нужно ввести название события");
				return;
			}
			
			that.event.remove(date, eventName);
			
			f.hide();
		});
	}
	
	
};

Calendar.prototype = {
	months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
				'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
	event: {
		save: function (date, eventName, contact, description) {
			if (typeof date !== 'object' || !date instanceof Date) {
				throw new Error({message: "The date should be provided"});
			}
			
			var key = date.getDate() + "." + date.getMonth() + "." + date.getFullYear();
			
			if (typeof this.store[key] === 'undefined') {
				this.store[key] = {};
				this.store[key].length = 0;
			}
			if (typeof this.store[key][eventName] === 'undefined') {
				this.store[key][eventName] = {};
			}

			this.store[key][eventName] = {
				contact: contact,
				description: description
			};
			this.store[key].length += 1;
			this.updateLocalStorage();
		},
		
		remove: function (date, eventName) {
			if (typeof date !== 'object' || !date instanceof Date) {
				throw "The date should be provided";
			}
			
			var key = date.getDate() + "." + date.getMonth() + "." + date.getFullYear();
			
			delete this.store[key][eventName];
			this.store[key].length -= 1;
			this.updateLocalStorage();
		},
		
		updateLocalStorage: function () {
			if (window.localStorage) {
				window.localStorage.eventStorage = JSON.stringify(this.store);
			}
		}
	},
	
	getToday: function () {
		return new Date();
	},
	
	changeMonth: function (delta) {
		var actualDate = this.currentDate;
		actualDate.setMonth( actualDate.getMonth() + delta );
		this.currentDate = actualDate;
	},
	
	drawMonth: function () {
		var d = new Date(this.currentDate),
			today = this.getToday(),
			divDays = document.querySelectorAll('div.dayNumber'),
			events = this.event.store,
			eventEl,
			parent,
			key,
			prop,
			ev,
			isToday,
			days_event,
			i, j;
		d.setDate(1);
		d.setDate(-(d.getDay() - 2));
		
		for (i = 0; i < divDays.length; i += 1) {
			parent = divDays[i].parentNode;
			key = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
			isToday = /today/.test(parent.className);
			if (this.isDateEqual(d, today)) {
				if ( !isToday ) {
					parent.className = parent.className + " today";
				}
			} else if ( isToday ) {
				parent.className = parent.className.replace(/\s?today/gi,"");
			}
			t.changeClass(parent, "eventExists", "");
			divDays[i].innerHTML = d.getDate();
			parent.setAttribute('name', d.getTime());
			days_event = parent.querySelectorAll('div.day_event');
			for (j = 0; j < days_event.length; j++) {
				parent.removeChild(days_event[j]);
			}
			if (events[key] && events[key].length > 0) {
				for ( prop in events[key] ) if ( events[key].hasOwnProperty(prop) && prop !== "length" ){
					ev = events[key][prop];
					eventEl = document.createElement('div');
					eventEl.className = 'day_event';
					eventEl.innerHTML = '<div class="eventName">' + decodeURIComponent(prop) + '</div>' +
										'<div class="eventContacts">' + decodeURIComponent(ev.contact) + '</div>';
					parent.appendChild(eventEl);
					t.changeClass(parent, "", "eventExists");
				}
			}
			d.setDate(d.getDate() + 1);
		}
		
	},
	
		
	isDateEqual: function (a, b) {
		return  (a.getDate() === b.getDate()) &&
				(a.getMonth() === b.getMonth()) &&
				(a.getFullYear() === b.getFullYear());
	},
	
	drawTitle: function () {
		this.dateTitleEl.innerText =
			this.months[this.currentDate.getMonth() * 1]
				+ ' ' + this.currentDate.getFullYear();
	}
};
}());



var cal = new Calendar();
