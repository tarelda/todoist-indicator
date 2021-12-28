const St = imports.gi.St;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Polyfill = Me.imports.polyfill;
const Todoist = Me.imports.todoist;
const Uuid = Me.imports.uuid;

let TodoistTaskMenuItem  = GObject.registerClass(
  class TodoistTaskMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(task, projects, on_activation, params) {
        super._init(params);
        this.actor.add_style_class_name("check-box");
        this.actor.add_style_class_name("todoist-indicator-container-task");

        let box = new St.Bin();
        let label = new St.Label({ text: task.content });

        this.actor.add_child(box);
        this.actor.add_child(label);

        if (projects instanceof Array) {
          projects.forEach((project) => {
            let label = new St.Label({
              text: project.name === "Inbox" ? _("Inbox") : project.name,
              style_class: "todoist-indicator-container-task-project-label",
            });
            if (Todoist.ObjectColors.has(project.color))
              label.set_style("color: " + Todoist.ObjectColors.get(project.color) + ";");
            this.actor.add_child(label);
          }, this);
        }

        let self = this;
        this.connect("activate", function (actor, event, data) {
          self.actor.add_style_pseudo_class("checked");

          if(on_activation)
            on_activation(task, () => self.destroy(), () => self.remove_style_pseudo_class("checked"));
        });
    }
  }
);

const TodoistIndicator = GObject.registerClass(
  class TodoistIndicator extends PanelMenu.Button {
    _init() {
    super._init(0.0, "Todoist Indicator");

    // properties init
    this._settings = Convenience.getSettings();
    this._api = new Todoist.API(this._settings.get_string("api-token"));
    this._tasks = [];
    this._projects = [];

    // label initialization
    this.buttonText = new St.Label({
    text: _("Loading..."),
    y_align: Clutter.ActorAlign.CENTER
    });
    this.actor.add_actor(this.buttonText);

      // layout setup
      this._container = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_expand: true,
        style_class: "todoist-indicator-container"
      });

      this.menu.box.add(this._container);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let refreshButton = new PopupMenu.PopupMenuItem(_("Refresh"));
      // refreshButton.actor.set_x_align(Clutter.ActorAlign.CENTER);
      refreshButton.connect("activate", this._refresh.bind(this));
      this.menu.addMenuItem(refreshButton);

      let openTodoistWebButton = new PopupMenu.PopupMenuItem(_("Open todoist.com"));
      // openTodoistWebButton.actor.set_x_align(Clutter.ActorAlign.CENTER);
      openTodoistWebButton.connect("activate", _openTodoistWeb);
      this.menu.addMenuItem(openTodoistWebButton);

      // start up
      this._refresh();
      this._refreshTimer = Mainloop.timeout_add_seconds(this._settings.get_int("refresh-interval"), this._refresh.bind(this));
    }

    _refresh() {
      let apiCallback = function (data) {
        if (data == undefined) {
          this._renderError(_("Connection error"));
          return;
        }

        this._parseProjects(data.projects);
        this._parseTasks(data.items);
        this._render();
      };

      this._api.sync(["items", "projects"], apiCallback.bind(this));
      return true;
    }

    // classification helpers
    _isDoneOrDeletedOrArchived (item){
      return item.checked === 1 || item.is_deleted === 1 || item.in_history === 1;
    }

    _isDeletedOrArchived(item) {
      return item.is_deleted === 1 || item.is_archived === 1;
    }

    _isNotDone(item) {
      return item.checked === 0;
    }

    _isDueDateToday(item) {
      if (item.due === null) return false;


      let dueDate = new Date(item.due.date);
      dueDate.setHours(0,0,0,0);
      let today_min = new Date(), today_max = new Date();
      today_min.setHours(0,0,0,0);
      today_max.setHours(23,59,59,999);

      return (dueDate >= today_min) && (dueDate <= today_max);
    }

    _isDueDateInPast(item) {
      if (item.due === null) return false;

      let dueDate = new Date(item.due.date);
      dueDate.setHours(0,0,0,0);
      let today = new Date();
      today.setHours(0,0,0,0);

      return dueDate < today;
    }

    // tasks actions
    _closeTask(task, on_success, on_failure) {
      let uuid = Uuid.UuidV1()
      let commands = [
        {
          uuid: uuid,
          type: "item_close",
          args: {
            id: task.id
          }
        }
      ];

      this._api.execute(commands, on_success, data => {
        log("close task command failed with error " + data.sync_status[uuid]["error"]);
        on_failure();
      });
    }

    // functions doing actual tasks and projects list parsing
    _parseTasks(tasks) {
    let undoneTasks = tasks.filter(this._isNotDone);
      // on init just push undone items
      if (this._tasks.length == 0) {
        this._tasks = undoneTasks;
        return;
      }

      undoneTasks.forEach(function (item) {
        // adds or updates undone items
        let index = this._tasks.findIndex(openItem => openItem.id === item.id);
        if (index === -1)
          this._tasks.splice(this._tasks.length, 0, item);
        else
          this._tasks[index] = item;
      }, this);

      let doneTasks = tasks.filter(this._isDoneOrDeletedOrArchived);

      doneTasks.forEach(function (item) {
        // remove items that are definitely done
        let index = this._tasks.findIndex(openItem => openItem.id === item.id);
        if (index > -1)
          this._tasks.splice(index, 1);
      }, this);

    }

    _parseProjects(projects) {
      let activeProjects = projects.filter(item => !this._isDeletedOrArchived(item));
      // init, there is always inbox so
      if (this._projects.length == 0) {
        this._projects = activeProjects;
        return;
      }

      projects.filter(function (item) {
        let index = this._tasks.findIndex(existingItem => existingItem.id === item.id);
        log("Item " + item.id + " found index " + index);

        if (index > -1) {
          if (this._isDeletedOrArchived(item))
            this._projects.splice(index, 1);
          else
            this._projects[index] = item;
        }
        else
          this._projects.push(item);
      }, this);

    }


    // rendering functions
    _getTextForTaskCount(count) {
      switch (count) {
        case 0: return _("no due tasks");
        default: return Gettext.ngettext("one due task", "%d due tasks", count).format(count);
      }
    }

    _renderTodoLists(pastDueItems, todayItems) {
      this._container.destroy_all_children();

      if (pastDueItems.length > 0) {
        this._container.add(new St.Label({
          text: _("PAST DUE"),
          style_class: "todoist-indicator-container-section-label",
        }));

        let pastDueContainer = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_expand: true
        });

        pastDueItems.sort(function (a, b) {
          return a.project_id - b.project_id;
        }, this);

        pastDueItems.forEach(function(item) {
          let menuItem = new TodoistTaskMenuItem(item, this._projects.filter(project => project.id === item.project_id || project.legacy_id === item.project_id), this._closeTask.bind(this));
    			pastDueContainer.add(menuItem.actor);
    		}, this);

        this._container.add(pastDueContainer);
      }


      if (todayItems.length > 0) {
        this._container.add(new St.Label({
          text: _("TODAY"),
          style_class: "todoist-indicator-container-section-label"
        }));

        let todayContainer = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_expand: true
        });

        todayItems.sort(function (a, b) {
          return a.day_order - b.day_order;
        }, this);

        todayItems.forEach(function(item) {
          let menuItem = new TodoistTaskMenuItem(item, this._projects.filter( project => project.id === item.project_id || project.legacy_id === item.project_id ), this._closeTask.bind(this));
          todayContainer.add(menuItem.actor);
        }, this);

        this._container.add(todayContainer);
      }
    }

    _render() {
      let pastDueItems = this._tasks.filter(this._isDueDateInPast);
      let todayItems = this._tasks.filter(this._isDueDateToday);

      this.buttonText.set_text(this._getTextForTaskCount(pastDueItems.length));
        this._renderTodoLists(pastDueItems, todayItems);
      }

    _renderError(errorMsg) {
      this.menu.box.destroy_all_children();
      this.buttonText.set_text(errorMsg);
    }

    stop() {
      if (this._refreshTimer) {
      Mainloop.source_remove(this._refreshTimer);
      this._refreshTimer = undefined;
      }

      this.menu.box.destroy_all_children();

      this._api.destroy();
    }
  }
);

function _openTodoistWeb() {
  Util.spawn(['xdg-open', 'https://todoist.com/app#agenda%2Foverdue%2C%20today']);
}

let _extensionInstance;

function init() {
  Gettext.textdomain("todoist@tarelda.github.com");
  Gettext.bindtextdomain("todoist@tarelda.github.com", Me.dir.get_child("locale").get_path());
}

function enable() {
  _extensionInstance = new TodoistIndicator;
  Main.panel.addToStatusArea("todoist-indicator", _extensionInstance);
}

function disable() {
  _extensionInstance.stop();
  _extensionInstance.destroy();
}
