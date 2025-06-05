<?php
// Prevent direct access
if (!isset($_POST) || empty($_POST)) {
    header('Location: ../contact.html');
    exit();
}

// email setting //
  $mailto    = "jvsteps@gmail.com";
  $bccMail   = "feedback1@asiapacific.com.my";  // leave it blank as options //
  $from      = "Durafloor";  // Name of the company where this form is belongs.
  $subject   = "Durafloor have enquiry From %name%";
  $referred  = 0;  // set 0 to turn off valid referred checking (disabled due to modern browser restrictions) //
  $skipEmpty = 1;  // hide all fields that have empty value //
  $emptyFld  = "";  // default value for empty fields //
  $FldLeng   = 1000;  // maximum string length for each fields //
  $returnS   = "../index.html";  // redirect page after email sent successfully //
  $returnF   = "";  // leave blank will back to previous page //

  // specify fields with different maximum string length //
  $a_cfl = array("address"=>350, "Enquiry"=>500);  // eg. array("address"=>100, "Enquiry"=>200);
  // required fields //
  $a_req = array("User_name","User_email","Tel_no");
  // ignored fields //
  $a_ign = array("submit","submit1");
  // allowed attachment file type //
  $path = "attach";
  $a_types = array("zip", "rar", "txt", "doc", "jpg", "jpeg", "png", "gif","docx","pdf");  // in lower case //

  // Basic spam protection
  function checkSpam($text) {
      $spam_words = array('viagra', 'casino', 'lottery', 'winner', 'congratulations', 'million dollars');
      $text_lower = strtolower($text);
      foreach ($spam_words as $word) {
          if (strpos($text_lower, $word) !== false) {
              return true;
          }
      }
      return false;
  }

  // auto redirect script //
  $redirect = "<SCRIPT>setTimeout(\"document.location.href='%return%'\", 5000);</SCRIPT>";

/*****************
 * Error Message *
 *****************/
$a_err[0] =
"Please fill up the required fields.
<a href='%return%'>Click here to return...</a>";

$a_err[1] =
"Required fields not found in form, please check your form or email setting.
<a href='%return%'>Click here to return...</a>";

$a_err[2] =
"Invalid extension for your attachment, only (%types%) are allowed!
<a href='%return%'>Click here to return...</a>";

$a_err[3] =
"Fail sending email at this time, you might entered an invalid e-mail address
<a href='%return%'>Click here to return...</a>";

$a_err[4] =
"Dear %name%,

Your input has successfully been sent.
Thank you for your input.
We will contact you shortly.
<a href='%return%'>Click here to return...</a>
".$redirect;

$a_err[5] =
"Invalid email address entered! Please try again.
<a href='%return%' >Click here to return...</a>";

// =============================== [End Edit Section] =============================== //

  function validReferred () {
          $valid_url = 'http://'.$_SERVER['HTTP_HOST'].'/';
          $valid_len = strlen($valid_url);

          // Check if HTTP_REFERER is set
          if (!isset($_SERVER['HTTP_REFERER']) || empty($_SERVER['HTTP_REFERER'])) {
             return true; // Allow submission if referer is not set (common with modern browsers)
          }

          if (substr($_SERVER['HTTP_REFERER'], 0, $valid_len) != $valid_url) {
             $mesg = "<b>You submitted this form from an invalid URL.</b><br />\r\n" .
                     "Please Use The <a href=\"".$valid_url."\">Form</a> Provided By Us.";

             echo $mesg;
             exit();
          }

          return true;
  } // END validReferred

  function validLength ($len, $specify=array()) {
          GLOBAL $mesg;

          $err = false;

          foreach ($_POST AS $varName => $value) {
             $i_len = $len;

             $s_varName = strtolower($varName);

             if (array_key_exists($s_varName, $specify)) {
                $i_len = $specify[$s_varName];
             }

             if (is_string($value) || is_int($value)) {
                if (strlen($value) > $i_len) {
                   $mesg .= "\$".$varName." has exceed length allowed (max ".$i_len." letters).<br />\r\n";
                   $err   = true;
                }
             } else if (is_array($value)) {
                foreach ($value AS $str) {
                   if (strlen($str) > $i_len) {
                      $mesg .= "String inside array \$".$varName." has exceed length allowed " .
                               "(max ".$i_len." letters).<br />\r\n";
                      $err   = true;

                      break;
                   }
                }
             } else {
                $mesg .= "\$".$varName." unknown variable has submitted.<br />\r\n";
                $err   = true;
             }
          }

          if ($err) {
             return false;
          }

          return true;
  } // END validLength

  function validEmail ($email, $checkDomain=0, $testConnection=0) {
          if (preg_match("/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/", $email)) {
             list($username,$domain) = explode("@", $email); // gets domain name //

             if (function_exists("checkdnsrr") && $checkDomain) {
                if (!checkdnsrr($domain, "MX")) {
                   // checks for if MX (Mail Exchange) records in the DNS //
                   return false;
                }
             }

             if ($testConnection) {
                if (!fsockopen($domain, 25, $errno, $errstr, 30)) {
                   // attempts a socket connection to mail server //
                   return false;
                }
             }
          } else {
             return false;
          }

          return true;
  } // END validEmail

  function f_getExt($path) {
          $path_parts = pathinfo($path);
          $ext = strtolower($path_parts["extension"]);

          return $ext;
  } // END f_getExt


  if (empty($returnF)) {
     $returnF = "javascript:window.history.back();";
  }
  foreach ($a_cfl AS $key => $value) {
     $key         = strtolower($key);
     $a_cfl[$key] = $value;
  }
  for ($x=0; $x<count($a_req); $x++) {
     $a_req[$x] = ucwords(str_replace("_", " ", $a_req[$x]));
  }
  for ($x=0; $x<count($a_ign); $x++) {
     $a_ign[$x] = ucwords(str_replace("_", " ", $a_ign[$x]));
  }


  //
  // security checking
  //
  if ($referred) {
     $valid = validReferred();
  } else {
     $valid = 1;
  }


  if ($valid) {
     $valid = validLength($FldLeng, $a_cfl);

     if (!$valid) {
        $error  = TRUE;
        $t_mesg = $mesg;
     }
  }
  if ($valid) {
     // Initialize error variable
     $error = FALSE;

     if (isset($_POST['User_Email'])) {
        $email = $_POST['User_Email'];
     } else if (isset($_POST['User_email'])) {
        $email = $_POST['User_email'];
     } else if (isset($_POST['user_Email'])) {
        $email = $_POST['user_Email'];
     } else if (isset($_POST['user_email'])) {
        $email = $_POST['user_email'];
     } else {
        $email = '';
     }

     if (!empty($email)) {
        $valid = validEmail($email, 1);

        if (!$valid) {
           $error  = TRUE;
           $t_mesg = str_replace("%return%", $returnF, nl2br($a_err[5]));
        }
     } else {
        $error  = TRUE;
        $t_mesg = str_replace("%return%", $returnF, nl2br($a_err[0]));
     }
  }


  if ($error != TRUE) {
     //
     // check required fields is existed and fully filled
     //
     $i        = 0;              // count variable need to put into email content //
     $noMatch  = 0;              // count number of fields ready match with required fields //
     $numReq   = count($a_req);  // total number of required fields //
     $pass     = FALSE;
     $reqNoVal = FALSE;          // required fields exist but no value entered by user //
     $error    = FALSE;          // error occur while process of send email //
     $a_key    = array();        // variable store key fields //
     $a_val    = array();        // variable store value fields //
     $content  = "";             // initialize content variable //

     foreach ($_POST as $key => $val) {
        if ($reqNoVal == TRUE) {
           break;
        }

        $sKey = ucwords(str_replace("_", " ", $key));

        if (in_array($sKey, $a_req)) {
           // key is matched, found 1 of the required field //
           if (empty($val)||$val=="Select State") {
              // empty value found in required fields, process send email FAILURE //
              $reqNoVal = TRUE;
           } else {
              //TODO// this variable might needed futher processing, convert it to specify name //
              $varName  = "p_".str_replace(" ", "_", $sKey);
              $$varName = $val;  // assign value into it //

              $noMatch++;
           }
        }

        //
        // ignore some of the fields
        //
        $b_ign = FALSE;

        if (in_array($sKey, $a_ign)) {
           // ignore this field, don't make it appears in email content //
           $b_ign = TRUE;
        }

        //
        // insert field name and its value to be displayed in email content
        //
        if ($b_ign == FALSE) {
           if (!$val) {
              if ($skipEmpty) {
                 continue; // skip this field if it has empty value..
              }
              $val = $emptyFld;  // put default value for empty fields //
           }

           // Sanitize input to prevent XSS
           $val = htmlspecialchars($val, ENT_QUOTES, 'UTF-8');

           $a_key[$i] = $sKey;
           $a_val[$i] = $val;
           $i++;
        }
     } // END foreach loop for each $_POST variables


     //
     // result of validation is done to the form
     //
     if ($reqNoVal == TRUE) {
        // required fields not filled or no value in it //
        $error  = TRUE;
        $t_mesg = str_replace("%return%", $returnF, nl2br($a_err[0]));
     } else if ($noMatch != $numReq) {
        // missing required fields in form that has set in email setting //
        $error  = TRUE;
        $t_mesg = str_replace("%return%", $returnF, nl2br($a_err[1]));
     }
  }


  if ($error != TRUE) {
     //
     //  process of generate email contents
     //
     for ($x=0; $x<count($a_key); $x++) {
        if (is_array($a_val[$x])) {
           $content .= $a_key[$x]." : \n";

           foreach ($a_val[$x] AS $dataList) {
              $content .= " - ".stripslashes($dataList)."\n";
           }
        } else {
           $content .= $a_key[$x]." : ".stripslashes($a_val[$x])."\n";

           // Check for spam in text fields
           if (checkSpam($a_val[$x])) {
               $error = TRUE;
               $t_mesg = "Your message appears to contain spam content. Please revise your message.";
               break;
           }
        }
     }

     $subject = str_replace(array("%name%","%company name%"), array($p_User_Name,$from), $subject);

     $boundary = "MIME_BOUNDRY";
     //$boundary = "b".md5(uniqid(mt_rand()));

     //
     // email headers
     //
     $header = "From: ".$p_User_Name." <".$p_User_Email.">\n" .
               "Reply-To: ".$p_User_Email."\n" .
               "MIME-Version: 1.0\n" .
               "Content-Type: multipart/mixed; boundary=\"".$boundary."\"\n" .
               "X-Priority: 3\n" .
               "X-Mailer: PHP / ".phpversion()."\n";
     if ($bccMail) {
        $header .= "Bcc: ".$bccMail."\n";
     }

     //
     // plain text email content (diplayed all fields and input data)
     //
     $body = "--".$boundary."\n" .
             "Content-Type: text/plain; charset=\"utf-8\"\n" .
             "Content-Transfer-Encoding: quoted-printable\n" .
             "\n" .
             $content."\n" .
             "\n";


     //
     // process of email attachment
     //
     if (!empty($_FILES['attach']['name'])) {
        // attachment found //
        $mimeType = $_FILES['attach']['type'];
        $filename = $_FILES['attach']['name'];
        $upfile   = $_FILES['attach']['tmp_name'];

        $ext = f_getExt($filename);
        if (!in_array($ext, $a_types)) {
           // file extension for this attachment is not allowed //
           $error = TRUE;

           foreach ($a_types as $ext) {
              $types .="*.".$ext.",";
           }

           $t_mesg = str_replace(array("%return%","%types%"), array($returnF,$types), nl2br($a_err[2]));
        } else {
           $fp     = fopen($upfile, "r");
           $string = fread($fp, filesize($upfile));
           $string = chunk_split(base64_encode($string));

           $body .= "--".$boundary."\n" .
                    "Content-Type: ".$mimeType."; name=\"".$filename."\"\n" .
                    "Content-Disposition: attachment; filename=\"".$filename."\"\n" .
                    "Content-Transfer-Encoding: base64\n" .
                    "\n" .
                    $string."\n" .
                    "\n";
        }
     } // END process of attachment

     $body .= "--".$boundary."--";
  }


  //
  // process of send email
  //
  if ($error != TRUE) {
     $b_status = @mail($mailto, $subject, $body, $header);

     if (!$b_status) {
        $t_mesg = str_replace("%return%", $returnF, nl2br($a_err[3]));
     } else {
        // form sent successfully, back to the page //
        $t_mesg = str_replace(array("%return%","%name%"), array($returnS,$p_User_Name), nl2br($a_err[4]));
     }
  }
?>