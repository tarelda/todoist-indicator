const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const TodoistPrefsWidget = GObject.registerClass({
    Name: 'Todoist.Prefs.Widget',
    GTypeName: 'TodoistPrefsWidget',
  },
  class TodoistPrefsWidget extends Gtk.Grid {
    _init(params) {
      super._init(params);
      this._settings = Convenience.getSettings();

      this.margin = 12;
      this.row_spacing = this.column_spacing = 6;
      this.set_orientation(Gtk.Orientation.VERTICAL);

      this.attach(
        new Gtk.Label({
          label: "<b>" + _("Todoist API token") + "</b>",
          use_markup: true,
          halign: Gtk.Align.START
        }),
        0, 0, 1, 1
      );

      let apiTokenInput = new Gtk.Entry({
          hexpand: true,
          margin_bottom: 12
      });

      this.attach(apiTokenInput, 1, 0, 1, 1);
      this._settings.bind("api-token", apiTokenInput, "text", Gio.SettingsBindFlags.DEFAULT);

      this.attach(
        new Gtk.Label({
          label: _("You need to declare a valid API token to allow this extension to communicate with the Todoist API on your behalf.") + "\n"
            + _("You can find your personal API token on Todoist's integration settings page at the very bottom."),
          wrap: true,
          xalign: 0
        }),
        0, 1, 2, 1
      );

      this.attach(
        new Gtk.Label({
          label: "<b>" +  _("Refresh interval") +  "</b>",
          use_markup: true,
          halign: Gtk.Align.START
        }), 
        0, 2, 1, 1
      );

      let refreshIntervalInput = new Gtk.SpinButton({
        digits: 0,
        adjustment: new Gtk.Adjustment({
          lower: 0,
          upper: 3600,
          step_increment: 1,
          page_increment: 1
        })
      });

      this.attach(refreshIntervalInput, 1, 2, 1, 1);
      this._settings.bind("refresh-interval", refreshIntervalInput, "value", Gio.SettingsBindFlags.DEFAULT);
    }
  }
);

function init() {
  Gettext.textdomain("todoist@tarelda.github.com");
  Gettext.bindtextdomain("todoist@tarelda.github.com", Me.dir.get_child("locale").get_path());
}

function buildPrefsWidget() {
    let widget = new TodoistPrefsWidget();
    widget.show_all();

    return widget;
}

