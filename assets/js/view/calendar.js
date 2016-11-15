Teambo.view.calendar = (function(t){
  "use strict";

  var calendar = document.createElement('div');
  calendar.id = "date_selector";

  var month_names = [];
  var weekdays = [];
  var active_el;
  var active;
  var interval;

  var initialized = false;
  var initialize = function() {
    for(var i = 1; i <= 7; i++) {
      weekdays.push(new Date('1970-02-0'+i+' 00:00').toDateString().slice(0,3));
    }
    for(var i = 1; i <= 12; i++) {
      var j = ('0' + i).slice(-2);
      month_names.push(new Date('1970-'+j+'-01 00:00').toDateString().slice(4,7));
    }
    initialized = true;
  };

  var viewOpts = function(date) {
    var prev = new Date(date.toISOString());
    prev.setMonth(date.getMonth()+1)
    var next = new Date(date.toISOString());
    next.setMonth(date.getMonth()-1)
    var d = {
      'month': month_names[date.getMonth()],
      'year': date.toISOString().slice(0,4),
      'days': weekdays,
      'weeks': [],
      'today': (new Date()).toISOString().slice(0,10),
      'prev': prev.toISOString().slice(0,7),
      'next': next.toISOString().slice(0,7)
    };
    var week = -1;
    var last_weekDay = 10;
    for(var i = 1; i < 31; i++) {
      var j = ('0' + i).slice(-2);
      var iso = date.toISOString().slice(0,8)+j+' 00:00';
      var m = new Date(iso);
      if(m.getMonth() > date.getMonth()) break;
      var weekday = m.getDay();
      if(weekday < last_weekDay) {
        week++;
        d.weeks[week] = new Array(7).fill(null);
      }
      last_weekDay = weekday;
      d.weeks[week][weekday] = {n: i, iso: iso.slice(0,10)};
    }
    return d;
  };

  var update = function(date) {
    var opts = viewOpts(date);
    opts.active = active;
    t.view.render(calendar, 'util/calendar', opts);
  };

  calendar.show = function(el) {
    if(!el) return;
    active_el = el;
    var date = new Date(el.value+' 00:00');
    if(isNaN(date.valueOf())) {
      date = new Date();
      active = null;
    } else {
      active = el.value;
    }
    update(date);
    calendar.style.display = 'block';
    var position = function() {
      calendar.style.left = (el.offsetLeft + el.offsetParent.offsetLeft + el.offsetWidth + 10) + 'px';
      calendar.style.top = (el.offsetTop + el.offsetParent.offsetTop - el.offsetParent.scrollTop) + 'px';
    };
    interval = setInterval(position, 500);
    position();
  };

  calendar.hide = function() {
    calendar.style.display = 'none';
    active_el = null;
    active = null;
    clearInterval(interval);
  };

  calendar.addEventListener('mousedown', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if(e.target.parentNode.classList.contains('nav')) {
      update(new Date(e.target.parentNode.dataset.month+'-01 00:00'));
    }
    if(e.target.classList.contains('day')) {
      var d = e.target.dataset.date;
      active_el.value = d;
      active = d;
      update(new Date(d));
    }
  });
  
  calendar.init = function(id) {
    var el = document.getElementById(id);
    if(!el) return;
    if(!initialized) {
      initialize();
    }
    el.addEventListener('focus', function() {
      calendar.show(el);
    });
    el.addEventListener('blur', function() {
      calendar.hide();
    });
  };

  t.event.on('pre-nav', function() {
    calendar.hide();
  });
  
  document.body.appendChild(calendar);

  return calendar;

})(Teambo);
