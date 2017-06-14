package wiki

var _compiled_assets = map[string]string{
	"/js/model/wiki.js": `Teambo.model.wiki = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      url: function() {
        return '/'+t.team.current.id+'/wiki/'+self.id;
      },
      parentUrl: function() {
        var par = model.get(self.opts.parent_id);
        if(par) {
          return par.url();
        } else {
          return '/'+t.team.current.id+'/wiki';
        }
      },
      icon: function() {
        return self.opts.parent_id ? 'angle-right' : 'book';
      },
      siblings: function() {
        return model.allByParent(self.opts.parent_id);
      },
      children: function() {
        return model.allByParent(self.id);
      },
      parents: function() {
        var ret = [];
        var par = model.get(self.opts.parent_id);
        while(par) {
          ret.push(par);
          par = model.get(par.opts.parent_id);
        }
        return ret.reverse();
      },
      hasChildren: function() {
        return self.children().length;
      }
    });
    if(self.opts.parid) {
      self.opts.parent_id = self.opts.parid;
    }
    if(self.opts.title) {
      self.opts.name = self.opts.title;
    }
  };

  model.type = 'wiki';

  model.schema = new t.schema({
    parent_id: { type: 'string', required: false, minLength: 8, maxLength: 8, empty: true },
    name:      { type: 'string', required: true,  maxLength: 256, searchable: true },
    text:      { type: 'text',   required: false, maxLength: 65535, searchable: true }
  });

  t.model._extend(model);

  model.top = function() {
    return model.allByParent(null);
  };

  model.allByParent = function(parent_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.parent_id == parent_id || (!o.opts.parent_id && !parent_id)) {
        ret.push(o);
      }
    }
    return ret;
  };

  return model;

})(Teambo);
`,
	"/js/app/wiki.js": `Teambo.apps.push((function(t){
  "use strict";

  var app = {
    name: 'wiki',
    label: 'Wiki'
  };

  t.event.on('app-init', function() {
    t.router.addRoutes({
      '/:team_id/wiki'                 : 'app/wiki/index',
      '/:team_id/wiki/new'             : 'app/wiki/new',
      '/:team_id/wiki/:wiki_id/new'    : 'app/wiki/new',
      '/:team_id/wiki/:wiki_id'        : 'app/wiki/view',
      '/:team_id/wiki/:wiki_id/remove' : 'app/wiki/remove',
      '/:team_id/wiki/:wiki_id/edit'   : 'app/wiki/edit',
    });
  });

  app.leftnav = function(){
    return function(text, render) {
      return render("{{>app/wiki/_left}}");
    };
  };

  app.searchResult = function(){
    return function(text, render) {
      return render("{{>app/wiki/_search-result}}");
    };
  };

  t.view.obj.ui.left_toggle.wiki = true;

  return app;

})(Teambo));
`,
	"/css/wiki.css": `
#dashboard .main .wiki-toc ul.children > li a { padding: 0 0 0 1em; }
#dashboard .main .wiki section.description { font-size: 0.9em; }
`,
}

var _compiled_templates = map[string]string{
	"template/wiki/edit": `<div class="wiki-edit" require-model="wiki">
{{#model.wiki.current}}
    <nav class="breadcrumbs">
        <a href="#{{team.url}}/wiki" title="Wiki"><i class="icon-book"></i></a>
        <a href="#{{url}}" data-keybind="Q" data-keybind-alt="escape" title="Page"><i class="icon-angle-right"></i></a>
        <span title="Edit Page"><i class="icon-edit"></i></span>
    </nav>
    <nav>
        <a href="#{{url}}/remove" data-keybind="R" title="Remove Page"><i class="icon-trash"></i></a>
    </nav>
    <h1><i class="icon-{{icon}}"></i> {{opts.name}}</h1>
    <a id="skipnav" class="skip-nav" href="#{{url}}/edit"></a>
    <div class="up1c">
        <form id="wiki-edit" name="wiki_edit" method="POST" class="std" data-wiki_id="{{id}}">
            <div class="field">
                <label for="wiki_name">Title</label>
                <input id="wiki_name" type="text" class="text large required min-len-2" name="name" autocomplete="off" placeholder="Page Title" value="{{opts.name}}" />
            </div>
            <div class="field">
                <textarea id="wiki_text" class="text tall full" name="text">{{opts.text}}</textarea>
            </div>
            <div class="field submit">
                <input type="submit" class="submit" value="Save Changes" />
                <a class="cancel" href="#{{url}}">cancel</a>
            </div>
            <div class="error"></div>
        </form>
    </div>
{{/model.wiki.current}}
</div>
`,
	"template/wiki/new": `<div class="wiki-new">
    <nav class="breadcrumbs">
        <a href="#{{team.url}}/wiki" data-keybind="Q" data-keybind-alt="escape" title="Wiki"><i class="icon-book"></i></a>
        <span title="Create Wiki Page"><i class="icon-plus-1"></i></span>
    </nav>
    <h1><i class="icon-book-add"></i> New Wiki Page</h1>
    <div class="up1c">
        <form id="wiki-new" name="wiki_new" method="POST" class="std">
            <input name="parent_id" type="hidden" value="{{wiki_id}}"/>
            <div class="field">
                <label for="wiki_name">Title</label>
                <input id="wiki_name" type="text" class="text large required min-len-2" name="name" autocomplete="off" placeholder="Page Title" value="{{opts.name}}" />
            </div>
            <div class="field">
                <textarea id="wiki_text" class="text tall full" name="text">{{opts.text}}</textarea>
            </div>
            <div class="field submit">
                <input type="submit" class="submit" value="Create Page" />
                <a class="cancel" href="#{{#model.wiki.current}}{{url}}{{/model.wiki.current}}{{^model.wiki.current}}{{team.url}}/wiki{{/model.wiki.current}}">cancel</a>
            </div>
            <div class="error"></div>
        </form>
    </div>
</div>
`,
	"template/wiki/_search-result": `{{#result.has_wiki}}
<li class="folder hi-10 up3c result-folder">
    <a href="#{{team.url}}/wiki" class="hi-05">
        <i class="icon-book"></i>
        <div class="info">{{result.count_wiki}} / {{result.total_wiki}}</div>
        <span class="name">Wiki</span>
    </a>
    <ul class="items">
    {{#result.wiki}}
        {{>app/wiki/_search-li}}
    {{/result.wiki}}
    </ul>
</li>
{{/result.has_wiki}}
`,
	"template/wiki/index": `<div class="wiki-index">
    <nav class="breadcrumbs">
        <a href="#{{team.url}}" class="invisible" data-keybind="Q" data-keybind-alt="escape"></a>
        <span class="active" title="Wiki"><i class="icon-book"></i></span>
    </nav>
    <nav>
        <a href="#{{team.url}}/wiki/new" data-keybind="C" title="Create Page"><i class="icon-plus-1"></i></a>
    </nav>
    <h1><i class="icon-book"></i> Wiki</h1>
    <a id="skipnav" class="skip-nav" href="#{{url}}"></a>
    <div class="up4c up4c3"></div>
    <div class="up4c up4c3b">
        {{>app/wiki/_toc}}
    </div>
</div>
`,
	"template/wiki/_children": `{{#children}}
    <li class="section child">
        <a href="#{{url}}" class="{{#active}}hi-10 active{{/active}}">
            <div class="img"><i class="icon-angle-right"></i></div>
            <div class="name">{{opts.name}}</div>
        </a>
    </li>
    {{#hasChildren}}
    <ul class="children">
        {{>app/wiki/_children}}
    </ul>
    {{/hasChildren}}
{{/children}}
`,
	"template/wiki/view": `<div class="wiki" require-model="wiki">
{{#model.wiki.current}}
    <nav class="breadcrumbs">
        <a href="#{{parentUrl}}" data-keybind="Q" data-keybind-alt="escape" title="Wiki"><i class="icon-book"></i></a>
        <span title="Page"><i class="icon-angle-right"></i></span>
    </nav>
    <nav>
        <a href="#{{url}}/edit" data-keybind="E" title="Edit Pate"><i class="icon-edit"></i></a>
        <a href="#{{url}}/new" data-keybind="C" title="New Page"><i class="icon-plus-1"></i></a>
    </nav>
    <h1><i class="icon-{{icon}}"></i> {{opts.name}}</h1>
    <a id="skipnav" class="skip-nav" href="#{{url}}"></a>
    <div class="up4c3">
    {{#opts.text}}
        <section class="description color-bg" role="main">
            {{#codeblock}}{{#nl2br}}{{#linkify}}{{opts.text}}{{/linkify}}{{/nl2br}}{{/codeblock}}
        </section>
    {{/opts.text}}
    </div>
    <div class="up4c up4c3b">
        {{>app/wiki/_toc}}
    </div>
    {{>team/history/_section}}
{{/model.wiki.current}}
</div>
`,
	"template/wiki/_left": `<div class="collapsible {{#ui.left_toggle.wiki}}open{{/ui.left_toggle.wiki}}" data-toggle-target="wiki">
    <div class="section hi-10">
        <div class="totals">
        {{#model.wiki.all.length}}
            {{model.wiki.all.length}}
        {{/model.wiki.all.length}}
        </div>
        <i class="icon-minus-1 nav color-hi-30 toggle-close" data-toggle="wiki"></i>
        <i class="icon-down-open-1 nav color-hi-30 toggle-open" data-toggle="wiki"></i>
        <a href="#{{team.url}}/wiki" class="nav-section" data-keybind="K">
            <div class="img"><i class="icon-book"></i></div>
            <div class="name">Wiki</div>
        </a>
    </div>
    <div class="section wiki subsection">
    {{#model.wiki.top}}
        <a href="#{{url}}" class="folder {{active}}" data-obj="wiki-{{id}}">
            <div class="img"><i class="icon-{{icon}}"></i></div>
            <div class="name">{{opts.name}}</div>
        </a>
    {{/model.wiki.top}}
    </div>
</div>
`,
	"template/wiki/_search-li": `<li id="wiki-li-{{id}}">
    <a href="#{{url}}" class="dim">
        <div class="img"><i class="icon-{{icon}} color-30"></i></div>
        <span class="name">{{opts.name}}</span>
    {{#opts.text}}
        <p class="description color-50">{{opts.text}}</p>
    {{/opts.text}}
    </a>
</li>
`,
	"template/wiki/_toc": `<section class="tags wiki-toc tags-full">
    <ul>
        <li class="section sibling">
            <a href="#{{team.url}}/wiki" class="{{^wiki_id}}hi-10 active{{/wiki_id}}">
                <div class="img"><i class="icon-book"></i></div>
                <div class="name">Home</div>
            </a>
        </li>
    {{#model.wiki.top}}
        <li class="section sibling">
            <a href="#{{url}}" class="{{#active}}hi-10 active{{/active}}">
                <div class="img"><i class="icon-book"></i></div>
                <div class="name">{{opts.name}}</div>
            </a>
        </li>
        {{>app/wiki/_children}}
    {{/model.wiki.top}}
    {{^model.wiki.top}}
        <p class="empty">Team has no wiki pages</p>
    {{/model.wiki.top}}
    </ul>
</section>
`,
	"template/wiki/remove": `<div class="wiki-remove" require-model="wiki">
{{#model.wiki.current}}
    <nav class="breadcrumbs">
        <a href="#{{team.url}}/wiki" title="Wiki"><i class="icon-book"></i></a>
        <a href="#{{url}}" data-keybind="Q" data-keybind-alt="escape" title="Page"><i class="icon-angle-right"></i></a>
        <span title="Remove Page"><i class="icon-trash"></i></span>
    </nav>
    <h1><i class="icon-{{icon}}"></i> {{opts.name}}</h1>
    <div class="up1c">
        <form id="wiki-remove" name="wiki_remove" method="POST" class="std ext remove">
            <input type="hidden" class="hidden" name="wiki_id" value="{{id}}"/>
            <p>Are you sure you want to remove this wiki page?</p>
            <div class="field submit">
                <input type="submit" class="submit" id="delete_submit" value="Remove Page" />
                <br/>
                <a class="cancel" href="#{{url}}">cancel</a>
            </div>
            <div class="error"></div>
        </form>
    </div>
{{/model.wiki.current}}
</div>
`,
}

var _compiled_templatejs = map[string]string{
	"template/wiki/new": `function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.wiki_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'text', 'parent_id']);
    t.model.wiki.create(data).then(function(wiki){
      t.view.updateSideNav();
      t.app.gotoUrl(wiki.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Wiki page could not be created", "Please try again");
    });
  });

}
`,
	"template/wiki/view": `function(t){
  "use strict";

  t.view.history.init(t.model.wiki.current);

  t.view.on('wiki-removed', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.app.gotoUrl('/wiki');
    }
  });
  t.view.on('wiki-updated', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
`,
	"template/wiki/edit": `function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.wiki_edit),
    wiki_id = form.dataset.wiki_id,
    wiki = t.model.wiki.get(wiki_id);
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'text']);
    var submit = function() {
      wiki.update(data, true).then(function(wiki){
        t.view.updateSideNav();
        t.app.gotoUrl(wiki.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Wiki could not be saved", "Please try again");
      });
    };
    submit();
  });

}
`,
	"template/wiki/remove": `function(t){
  "use strict";

  var form = new t.form(document.wiki_remove);
  var wiki_id = form.wiki_id.value;
  var wiki = t.model.wiki.get(wiki_id);
  var parent = wiki.parents().pop();
  form.addEventListener("submit", function(e) {
    form.disable();
    wiki.remove().then(function(){
      t.view.updateSideNav();
      t.app.gotoUrl(parent ? parent.url() : t.team.current.url() + '/wiki');
    }).catch(function(e){
      form.enable();
      form.error.msg("Wiki page could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
`,
}
