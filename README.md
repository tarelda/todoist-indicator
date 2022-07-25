# Unofficial Todoist Gnome Shell extension

This is an unofficial Gnome Shell extension which has been forked from original [project](https://github.com/ubuntudroid/todoist-gnome-shell-extension) and heavily modified.
At the moment it displays the number of currently open tasks in the top right corner of your Gnome Shell and today/past due task views in a dropdown. Clicking on task allows to close it.

![Screenshot](assets/todoist-gnome-shell-extension.png?raw=true "Screenshot")

# Compatibility

Since I maintain this project in my spare time I don't intend to support versions other than one I currently use. I am usually running current Ubuntu LTS and GNOME version that is shipping with it. Thanks to @aadilayub codebase was adapted to run on GNOME 40/41, but there is no guarantees. Still feel free to report any quirks in the issues.

# Setup

Clone the repository to `~/.local/share/gnome-shell/extensions/` into a folder named `todoist@tarelda.github.com` using the following command:

    git clone https://github.com/tarelda/todoist-indicator.git todoist@tarelda.github.com

The name of the directory is important because Gnome Shell won't recognize the extension otherwise.

Then restart Gnome Shell (ALT-F2 and then 'r') and navigate to https://extensions.gnome.org/local/. You can enable the extension and specify your Todoist API token there.

By default extension syncs every 60 seconds. That means it could take up to one minute before the task count appears after setting the API token in the settings.

Past Due tasks are sorted by project id, while Today view shows them in todoist assigned order.


# TODO

- add more translations
- improve error handling
- utilize system notifications
- try to push it into extensions store
- make sorting configurable

# Translations

Directory scripts contains translation_example.sh script describing procedure for adding translation.

# Acknowledgments

Code has been heavily influenced by this projects, blogposts and pieces of documentation:.

- [gnome-shell-tw](http://smasue.github.io/gnome-shell-tw)
- [Making Gnome Shell Plugins Save Their Config](http://www.mibus.org/2013/02/15/making-gnome-shell-plugins-save-their-config/)
- [Gnome Shell Extensions Writing documentation](https://wiki.gnome.org/Projects/GnomeShell/Extensions/Writing)
- [gnome-shell-extension-docker](https://github.com/gpouilloux/gnome-shell-extension-docker)
- [GJS API documentation](https://gjs-docs.gnome.org)
- [gnodoist-gnome-shell-extension](https://github.com/pringlized/gnodoist-gnome-shell-extension) (which is another unmaintained fork of original project)
- [timepp gnome shell extension](https://github.com/zagortenay333/timepp__gnome)
- [UUID implementation in JS](https://github.com/uuidjs/uuid)

Kudos to the authors! :)