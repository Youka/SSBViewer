var org_width, org_height;

function showPosition(evt){
	var hint = document.getElementById("position");
	if(evt){
		if(!org_width || !org_height){
			org_width = evt.target.clientWidth;
			org_height = evt.target.clientHeight;
		}
		hint.innerHTML = parseInt((evt.clientX - evt.target.offsetLeft + window.pageXOffset) * (org_width / evt.target.clientWidth)) + 
						" / " +
						parseInt((evt.clientY - evt.target.offsetTop + window.pageYOffset) * (org_height / evt.target.clientHeight));
		hint.style.left = evt.clientX + 5 + "px";
		hint.style.top = evt.clientY + 5 + "px";
	}else
		hint.innerHTML = "";
}
function scaleSize(){
	var src = document.getElementById('zoom'),
		target = document.getElementById('display');
	if(!org_width || !org_height){
		org_width = target.clientWidth;
		org_height = target.clientHeight;
	}
	target.style.width = src.value * org_width + "px";
	target.style.height = src.value * org_height + "px";
}
function setSize(){
	var src = document.getElementById('size'),
		target = document.getElementById('display'),
		selector = document.getElementById('zoom');
	switch(src.value){
		case "480":
			org_width = 640;
			org_height = 480;
			break;
		case "396":
			org_width = 704;
			org_height = 396;
			break;
		case "720":
			org_width = 1280;
			org_height = 720;
			break;		
		case "1080":
			org_width = 1920;
			org_height = 1080;
			break;
		default:
			return;
	}
	target.style.width = org_width + "px";
	target.style.height = org_height + "px";
	selector.value = 1;
}
function changeContent(){
	var pattern = document.getElementById('pattern');
		color = document.getElementById('color'),
		file = document.getElementById('file');
	if(pattern.value == 'image'){
		file.style.display = 'initial';
		color.style.display = 'none'
	}else{
		file.style.display = 'none';
		color.style.display = 'initial';
	}
	render();
}
var error_id = -1;
function showError(message){
	if(error_id != -1)
		clearInterval(error_id);
	var div = document.getElementById("error_tip"),
		show_time = 3000,
		fade_time = 1000,
		interval_time = 50,
		current_time = show_time + fade_time;
	div.style.display = "initial";
	div.innerHTML = message;
	div.style.opacity = 1;
	error_id = setInterval(function(){
		if(current_time <= 0){
			div.style.display = "none";
			clearInterval(error_id);
			error_id = -1;
		}else if(current_time <= fade_time)
			div.style.opacity = current_time / fade_time;
		current_time -= interval_time;
	}, interval_time);
	div.onmousemove = function(){
		current_time = show_time + fade_time;
		div.style.opacity = 1;
	};
}
var loading_counter = 0;
function showLoading(confirm){
	loading_counter = confirm ? loading_counter + 1 : loading_counter - 1;
	document.getElementById('loading').style.display = loading_counter > 0 ? "initial" : "none";
}
var editor;
function render(){
	setSize();
	var h_ms_pat = /^[0-9]+$/,
		m_s_pat = /^[0-5]?[0-9]$/,
		hours = document.getElementById('hours').value,
		minutes = document.getElementById('minutes').value,
		seconds = document.getElementById('seconds').value,
		milliseconds = document.getElementById('milliseconds').value;
	if(!h_ms_pat.test(hours) || !m_s_pat.test(minutes) || !m_s_pat.test(seconds) || !h_ms_pat.test(milliseconds))
		showError("Invalid time!");
	else{
		var http_request = new XMLHttpRequest(),
			data;
		if(document.getElementById('pattern').value == "image"){
			var form = document.createElement("form");
			form.appendChild(document.getElementById('file').cloneNode(true));
			data = new FormData(form);
		}else{
			data = new FormData();
			data.append("color", document.getElementById('color').value);
		}
		data.append("width", org_width);
		data.append("height", org_height);
		data.append("pattern", document.getElementById('pattern').value);
		data.append("script", editor.getValue());
		data.append("time", Number(milliseconds) + Number(seconds) * 1000 + Number(minutes) * 60000 + Number(hours) * 3600000);
		http_request.onreadystatechange = function(){
			if(http_request.readyState == 4){
				if(http_request.status == 200){
					var response = http_request.response;
					if(response.substr(0,22) == "data:image/png;base64,")
						document.getElementById("img").src = response;
					else{
						document.getElementById("img").src = "x"; // Throw image error event
						showError(http_request.response);
					}
				}else
					showError("Error " + http_request.status +
							"\n" + http_request.response);
				showLoading(false);
			}
		}
		http_request.open("POST", "renderer.php", true);
		http_request.overrideMimeType("multipart/form-data");
		showLoading(true);
		http_request.send(data);
	}
}