const Soup = imports.gi.Soup;

const APIURL = 'https://todoist.com/API/v8';

var ObjectColors = new Map([
	[30, "#b8256f"],
	[31, "#db4035"],
	[32, "#ff9933"],
	[33, "#fad000"],
	[34, "#afb83b"],
	[35, "#7ecc49"],
	[36, "#299438"],
	[37, "#6accbc"],
	[38, "#158fad"],
	[39, "#14aaf5"],
	[40, "#96c3eb"],
	[41, "#4073ff"],
	[42, "#884dff"],
	[43, "#af38eb"],
	[44, "#eb96eb"],
	[45, "#e05194"],
	[46, "#ff8d85"],
	[47, "#808080"],
	[48, "#b8b8b8"],
	[49, "#ccac93"],
]);

var API = class API {
	constructor(token) {
		this._token = token
		this._syncToken = "*"
		this._session = new Soup.Session();
	}

	sync(resource_types, on_success, on_failure) {
		let params = {
			token: this._token,
			sync_token: this._syncToken,
			resource_types: JSON.stringify(resource_types)
		}
		let request = Soup.form_request_new_from_hash('POST', APIURL + "/sync", params);
    let on_response = function (session, response) {
  		if (response.status_code !== 200) {
  			on_failure();
  			return;
  		}
  		let data = JSON.parse(response.response_body.data);
  		this._syncToken = data.sync_token;
  		on_success(data);
  	}
		this._session.queue_message(request, on_response.bind(this));
	}

	execute(commands, on_success, on_failure) {
		let params = {
			token: this._token,
			commands: JSON.stringify(commands)
		}

		let request = Soup.form_request_new_from_hash('POST', APIURL + "/sync", params);

		let on_response = function (session, response) {
  		if (response.status_code !== 200) {
				on_failure();
  			return;
  		}

			let data = JSON.parse(response.response_body.data);

			let hasFailed = false;
			commands.forEach(function(command) {
				if (data.sync_status[command.uuid] !== "ok")
					hasFailed = true
			}, this);


			if (on_failure && hasFailed) on_failure(data);
			else if (on_success) on_success(data);

  	};

		this._session.queue_message(request, on_response.bind(this));
	}

	destroy() {
		if (this._session != undefined)
			this._session.abort();
		this._session = undefined
	}
};