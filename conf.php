<?php

/**
 * @file
 * Configuration file for ID-AJAX package.
 *
 * It is likely that only the first two values need changing.
 * See README.md for advice.
 */

/**
 * ServiceName
 *
 * Service name parameter is used e.g in MobileAuthenticate request.
 * When live, see your Customer Agreement, look for
 * "DigiDocService Mobiil-ID päringute puhul kasutatavad teenuse nimetused:"
 * It might look like ABC and it actually works like a password.
 * When testing, use 'Testimine'.
 */
define('DD_SERVICE_NAME', 'Testimine');

/**
 * DigiDocService endpoint URL
 *
 * When testing, you could use https://www.openxades.org:8443
 * When in live, check your Customer Agreement (Kliendileping)
 * for "DigiDoc Service veebiteenuse aadress:", it probably is
 * https://digidocservice.sk.ee
 */
define('DDS_ENDPOINT', 'https://www.openxades.org:8443');

/**
 * Server connection settings.
 */
define('DD_PROXY_HOST', '');
define('DD_PROXY_PORT', '');
define('DD_PROXY_USER', '');
define('DD_PROXY_PASS', '');
define('DD_TIMEOUT', '9000');

/**
 * DigiDocService certifcate issuer certificate file.
 */
define('DD_SERVER_CA_FILE', dirname(__FILE__) . '/lib/service_certs.pem');

/**
 * Default language.
 * Possible values: EST / ENG / RUS
 */
define('DD_DEF_LANG', 'EST');

/**
 * If uploading files is allowed.
 */
define('FILESTORE_ALLOW_UPLOADS', TRUE);

/**
 * If saving local files is allowed.
 */
define('LOCAL_FILES', TRUE);

/**
 * DigiDocService WSDL and other addresses. Most likely these don't need changing.
 */
define('DD_WSDL', DDS_ENDPOINT . '/?wsdl');
define('DD_PATH', DDS_ENDPOINT . '/DigiDocService');
define('DD_NAMESPACE', 'https://digidocservice.sk.ee/DigiDocService/DigiDocService.wsdl');
define('DD_WSDL_DATAFILE', '{' . DD_NAMESPACE . '}DataFileData');

/**
 * PEAR code path.
 *
 * We add PEAR_PATH to the include path.
 * Comment out these three lines to use system PEAR.
 * @copyright   http://pear.php.net/package/SOAP
 */
define('PEAR_PATH', dirname(__FILE__) . '/lib/_PEAR/');
$path = preg_replace('/^\.\:/', '', get_include_path());
set_include_path('.:' . PEAR_PATH . ':' . $path);

// Include PEAR code.
require_once 'SOAP/Client.php';
require_once 'XML/Unserializer.php';

/**
 * PEAR errors callback (global function).
 * tanel
 */
if (function_exists('raise_error'))
    PEAR::setErrorHandling(PEAR_ERROR_CALLBACK, 'raise_error');
