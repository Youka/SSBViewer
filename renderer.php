<?PHP
// Include utilities
require("utils.php");
// Get POST data
$width = $_POST['width'];
$height = $_POST['height'];
$pattern = $_POST['pattern'];
$script = $_POST['script'];
$time = $_POST['time'];
$color;
$file;
if($pattern === "image"){
	if($_FILES['file']['error'] !== 0)
		return print("Image upload failed!");
	elseif($_FILES['file']['type'] !== "image/png")
		return print("Input file has to be a PNG image!");
	$file = $_FILES['file'];
}else
	$color = array(
				hexdec(substr($_POST['color'],0,2)),
				hexdec(substr($_POST['color'],2,2)),
				hexdec(substr($_POST['color'],4,2))
			);
// Create temporary file for output image
$tmp_file = new TmpFile("img");
// Draw image
$img = imagecreatetruecolor($width,$height);
imagesavealpha($img, true);
if($pattern == "image"){
	$template = imagecreatefrompng($file['tmp_name']);
	imagealphablending($img,false);
	imagecopyresampled($img,$template,0,0,0,0,$width,$height,imagesx($template),imagesy($template));
	imagedestroy($template);
}else{
	imagefill($img,0,0,imagecolorallocate($img,$color[0],$color[1],$color[2]));
	if($pattern == "tiled"){
		$color_offset = 32;
		$tile_color = NULL;
		if($color[0] > 127 || $color[1] > 127 || $color[2] > 127)
			$tile_color = imagecolorallocate($img,max($color[0]-$color_offset,0),max($color[1]-$color_offset,0),max($color[2]-$color_offset,0));
		else
			$tile_color = imagecolorallocate($img,min($color[0],255)+$color_offset,min($color[1]+$color_offset,255),min($color[2]+$color_offset,255));
		$tile_size = 20;
		for($y = 0; $y < $height; $y+=$tile_size)
			for($x = ($y/$tile_size%2)*$tile_size; $x < $width; $x+=$tile_size+$tile_size)
				imagefilledrectangle($img,$x,$y,$x+$tile_size,$y+$tile_size,$tile_color);
	}
}
imagepng($img, $tmp_file->getName());
imagedestroy($img);
// Render on image with external program
if(!chdir("workspace"))
	return print("Couldn't change to working directory!");
$status = timeout_exec(sprintf("../renderer/renderer %s %s %s", escapeshellarg($tmp_file->getName()), escapeshellarg($time), escapeshellarg($script)),
		"", $out, $err, 10000);
if($status !== 0){
	if($out === "")
		return print("Renderer not found (or not answering)!");
	else
		return print($out);
}
// Output base64 encoded image
echo 'data:image/png;base64,' . base64_encode(file_get_contents($tmp_file->getName()));
 ?>