const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Polyfill = Me.imports.polyfill;
const Todoist = Me.imports.todoist;

const TodoistIndicator = class TodoistIndicator extends PanelMenu.Button {

	_init() {
		// properties init
		this._settings = Convenience.getSettings();
		this._api = new Todoist.API(this._settings.get_string("api-token"));
		this._items = [];

		super._init(0.0, "Todoist Indicator");

		// label initialization
		this.buttonText = new St.Label({
			text: _("Loading..."),
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add_actor(this.buttonText);

		// start up
		this._refresh();
		this._timeout = Mainloop.timeout_add_seconds(this._settings.get_int("refresh-interval"), this._refresh.bind(this));
	}

	_refresh() {
		let apiCallback = function (data) {
			if (data == undefined) {
				this._renderError("Connection error");
				return;
			}
			this._parseItems(data.items);
			this._render();
		};

		this._api.sync(["items"], apiCallback.bind(this));
		return true;
	}

	// classification helpers
	_isDoneOrDeletedOrArchived (item){
		return item.checked === 1 || item.is_deleted === 1 || item.in_history === 1;
	}

	_isNotDone(item) {
		return item.checked === 0;
	}

	_isDueDateInPast(item) {
	    if (item.due === null) return false;

	    let dueDate = new Date(item.due.date);
	    dueDate.setHours(0,0,0,0);
	    let today = new Date;
	    today.setHours(0,0,0,0);

	    return dueDate <= today;
	}

	// function doing actual item list parsing
	_parseItems(items) {
		let undoneItems = items.filter(this._isNotDone);
		let doneItems = items.filter(this._isDoneOrDeletedOrArchived);

		undoneItems.forEach(function (item) {
			// adds or updates undone items
			let index = this._items.findIndex(openItem => openItem.id === item.id);
			if (index === -1)
				this._items.splice(this._items.length, 0, item);
			else
				this._items[index] = item
		}, this);

		doneItems.forEach(function (item) {
			// remove items that are definitely done
			let index = this._items.findIndex(openItem => openItem.id === item.id);
			if (index > -1)
				this._items.splice(index, 1);
		}, this);
	}


	// rendering functions
	_getTextForTaskCount(count) {
		switch (count) {
			case 0: return "no due tasks";
			case 1: return "one due task";
			default: return count + " due tasks";
		}
	}

	_renderMenu(items) {
		this.menu.removeAll();
		items.forEach(function(item) {
			this.menu.addMenuItem(new PopupMenu.PopupMenuItem(item.content));
		}, this);

		// this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		//
		// let viewOnTodoistButton = new PopupMenu.PopupMenuItem("view on todoist.com", {
		// 	hover: false
		// });
		// viewOnTodoistButton.connect("activate", _openTodoistWeb);
		// this.menu.addMenuItem(viewOnTodoistButton);
	}

	_render() {
		let dueItems = this._items.filter(this._isDueDateInPast);

		this.buttonText.set_text(this._getTextForTaskCount(dueItems.length));
		this._renderMenu(dueItems);
	}

	_renderError(errorMsg) {
		this.menu.removeAll();
		this.buttonText.set_text(errorMsg);
	}

	stop() {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = undefined;
		}

		this.menu.removeAll();

		this.api.destroy();
	}
};

function _openTodoistWeb() {
	Util.spawn(['xdg-open', 'https://todoist.com/app#agenda%2Foverdue%2C%20today'])
}

let _extensionInstance;

function init() {

}

function enable() {
	_extensionInstance = new TodoistIndicator;
	Main.panel.addToStatusArea('todoist-indicator', _extensionInstance);
}

function disable() {
	_extensionInstance.stop();
	_extensionInstance.destroy();
}
