const Soup = imports.gi.Soup;

const APIURL = 'https://todoist.com/API/v9';

var ObjectColors = new Map([
  ["berry_red", "#b8256f"],
  ["red", "#db4035"],
  ["orange", "#ff9933"],
  ["yellow", "#fad000"],
  ["olive_green", "#afb83b"],
  ["lime_green", "#7ecc49"],
  ["green", "#299438"],
  ["mint_green", "#6accbc"],
  ["teal", "#158fad"],
  ["sky_blue", "#14aaf5"],
  ["light_blue", "#96c3eb"],
  ["blue", "#4073ff"],
  ["grape", "#884dff"],
  ["violet", "#af38eb"],
  ["lavender", "#eb96eb"],
  ["magenta", "#e05194"],
  ["salmon", "#ff8d85"],
  ["charcoal", "#808080"],
  ["grey", "#b8b8b8"],
  ["taupe", "#ccac93"],
]);

var API = class API {
  constructor(token) {
    this._token = token
    this._syncToken = "*"
    this._session = new Soup.Session();
  }

  sync(resource_types, on_success, on_failure) {
    let params = {
      sync_token: this._syncToken,
      resource_types: JSON.stringify(resource_types)
    }
    let request = Soup.form_request_new_from_hash("POST", APIURL + "/sync", params);
    request.request_headers.append("Authorization", "Bearer " + this._token);

    let on_response = function (session, response) {
      if (response.status_code !== 200) {
        on_failure(response);
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
      commands: JSON.stringify(commands)
    }

    let request = Soup.form_request_new_from_hash("POST", APIURL + "/sync", params);
    request.request_headers.append("Authorization", "Bearer " + this._token);

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