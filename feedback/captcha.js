	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 4;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	document.write(randomstring);




//Validate captcha when submit button is pressed
function validate(AntiSpam, ans)
{
 if (AntiSpam == randomstring) {
  document.form1.action = 'feedback/feedback.php';
  return true;
 } else {
  alert('Please enter the correct verification code');
  return false;
 }
}
function load(url)
{
 location.href=url;
}


//Generate random background behind the captcha
 var imgCount = 6;
        var dir = 'feedback/';
        var randomCount = Math.round(Math.random() * (imgCount - 1)) + 1;
        var images = new Array
                images[1] = "captcha1.jpg",
                images[2] = "captcha2.jpg",
                images[3] = "captcha3.jpg",
				images[4] = "captcha4.jpg",
				images[5] = "captcha5.jpg",
				images[6] = "captcha6.jpg",
        document.getElementById("captcha").style.backgroundImage = "url(" + dir + images[randomCount] + ")"; 