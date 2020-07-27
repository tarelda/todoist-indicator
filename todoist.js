const Soup = imports.gi.Soup;

const APIURL = 'https://todoist.com/API/v8';

const API = class API {
	constructor(token) {
		this._token = token
		this._syncToken = "*"
		this._session = new Soup.Session();
	}

	sync(resource_types, callback) {
		let params = {
			token: this._token,
			sync_token: this._syncToken,
			resource_types: JSON.stringify(resource_types)
		}
		let request = Soup.form_request_new_from_hash('POST', APIURL + "/sync", params);
    let on_response = function (session, response) {
  		if (response.status_code !== 200) {
  			callback(undefined);
  			return;
  		}
  		let data = JSON.parse(response.response_body.data);
  		this._syncToken = data.sync_token;
  		callback(data);
  	}
		this._session.queue_message(request, on_response.bind(this));
	}

	destroy() {
		if (this._session != undefined)
			this._session.abort();
		this._session = undefined
	}
};