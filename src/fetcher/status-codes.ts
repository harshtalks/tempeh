export const httpErrorStatusCodes = {
  400: {
    message: "Bad Request",
    description:
      "The server cannot process the request due to a client error, such as malformed syntax, invalid request message framing, or deceptive request routing.",
    label: "BAD_REQUEST" as const,
    type: "client",
  },
  401: {
    message: "Unauthorized",
    description:
      "The request lacks valid authentication credentials for the target resource. The client must authenticate to get the requested response.",
    label: "UNAUTHORIZED" as const,
    type: "client",
  },
  402: {
    message: "Payment Required",
    description:
      "Reserved for future use. This status code was originally intended for digital payment systems, but is rarely used in practice.",
    label: "PAYMENT_REQUIRED" as const,
    type: "client",
  },
  403: {
    message: "Forbidden",
    description:
      "The server understood the request but refuses to authorize it. Unlike 401, authentication will not help and the request should not be repeated.",
    label: "FORBIDDEN" as const,
    type: "client",
  },
  404: {
    message: "Not Found",
    description:
      "The server cannot find the requested resource. This often means the URL is mistyped or the resource has been moved or deleted.",
    label: "NOT_FOUND" as const,
    type: "client",
  },
  405: {
    message: "Method Not Allowed",
    description:
      "The request method is known by the server but is not supported by the target resource. For example, an API may not allow calling DELETE to remove a resource.",
    label: "METHOD_NOT_ALLOWED" as const,
    type: "client",
  },
  406: {
    message: "Not Acceptable",
    description:
      "The server cannot produce a response matching the list of acceptable values defined in the request's proactive content negotiation headers.",
    label: "NOT_ACCEPTABLE" as const,
    type: "client",
  },
  407: {
    message: "Proxy Authentication Required",
    description:
      "Similar to 401 Unauthorized, but indicates that the client must first authenticate itself with the proxy server.",
    label: "PROXY_AUTHENTICATION_REQUIRED" as const,
    type: "client",
  },
  408: {
    message: "Request Timeout",
    description:
      "The server did not receive a complete request message within the time that it was prepared to wait. The client may repeat the request without modifications at any later time.",
    label: "REQUEST_TIMEOUT" as const,
    type: "client",
  },
  409: {
    message: "Conflict",
    description:
      "The request conflicts with the current state of the target resource. This is often used in PUT requests when updating a resource that has changed since the client last retrieved it.",
    label: "CONFLICT" as const,
    type: "client",
  },
  410: {
    message: "Gone",
    description:
      "The target resource is no longer available at the server and no forwarding address is known. This condition is expected to be permanent.",
    label: "GONE" as const,
    type: "client",
  },
  411: {
    message: "Length Required",
    description:
      "The server refuses to accept the request without a defined Content-Length header. The client may repeat the request if it adds a valid Content-Length header field.",
    label: "LENGTH_REQUIRED" as const,
    type: "client",
  },
  412: {
    message: "Precondition Failed",
    description:
      "One or more conditions given in the request header fields evaluated to false when tested on the server. Used for conditional requests, like If-Unmodified-Since.",
    label: "PRECONDITION_FAILED" as const,
    type: "client",
  },
  413: {
    message: "Content Too Large",
    description:
      "The server is refusing to process a request because the request payload is larger than the server is willing or able to process.",
    label: "CONTENT_TOO_LARGE" as const,
    type: "client",
  },
  414: {
    message: "URI Too Long",
    description:
      "The server is refusing to service the request because the request-target is longer than the server is willing to interpret.",
    label: "URI_TOO_LONG" as const,
    type: "client",
  },
  415: {
    message: "Unsupported Media Type",
    description:
      "The server is refusing to service the request because the payload format is in an unsupported format. The format problem might be due to the request's indicated Content-Type or Content-Encoding.",
    label: "UNSUPPORTED_MEDIA_TYPE" as const,
    type: "client",
  },
  416: {
    message: "Range Not Satisfiable",
    description:
      "The client has asked for a portion of the file (byte serving), but the server cannot supply that portion. For example, if the client asked for a part of the file that lies beyond the end of the file.",
    label: "RANGE_NOT_SATISFIABLE" as const,
    type: "client",
  },
  417: {
    message: "Expectation Failed",
    description:
      "The server cannot meet the requirements of the Expect request-header field. This often happens when the server doesn't support or recognize an expectation indicated by the client.",
    label: "EXPECTATION_FAILED" as const,
    type: "client",
  },
  421: {
    message: "Misdirected Request",
    description:
      "The request was directed at a server that is not able to produce a response. This can be sent by a server that is not configured to produce responses for the combination of scheme and authority that are included in the request URI.",
    label: "MISDIRECTED_REQUEST" as const,
    type: "client",
  },
  422: {
    message: "Unprocessable Content",
    description:
      "The server understands the content type of the request entity, and the syntax of the request entity is correct, but it was unable to process the contained instructions.",
    label: "UNPROCESSABLE_CONTENT" as const,
    type: "client",
  },
  423: {
    message: "Locked",
    description:
      "The source or destination resource of a method is locked. This response should contain an appropriate precondition or postcondition code, such as 'Lock-Token'.",
    label: "LOCKED" as const,
    type: "client",
  },
  424: {
    message: "Failed Dependency",
    description:
      "The method could not be performed on the resource because the requested action depended on another action and that action failed.",
    label: "FAILED_DEPENDENCY" as const,
    type: "client",
  },
  425: {
    message: "Too Early",
    description:
      "The server is unwilling to risk processing a request that might be replayed, which creates the potential for a replay attack.",
    label: "TOO_EARLY" as const,
    type: "client",
  },
  426: {
    message: "Upgrade Required",
    description:
      "The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.",
    label: "UPGRADE_REQUIRED" as const,
    type: "client",
  },
  428: {
    message: "Precondition Required",
    description:
      "The origin server requires the request to be conditional. This response is intended to prevent the 'lost update' problem, where a client GETs a resource's state, modifies it and PUTs it back to the server, when meanwhile a third party has modified the state on the server.",
    label: "PRECONDITION_REQUIRED" as const,
    type: "client",
  },
  429: {
    message: "Too Many Requests",
    description:
      "The user has sent too many requests in a given amount of time ('rate limiting'). The response representations SHOULD include details explaining the condition, and MAY include a Retry-After header indicating how long to wait before making a new request.",
    label: "TOO_MANY_REQUESTS" as const,
    type: "client",
  },
  431: {
    message: "Request Header Fields Too Large",
    description:
      "The server is unwilling to process the request because its header fields are too large. The request may be resubmitted after reducing the size of the request header fields.",
    label: "REQUEST_HEADER_FIELDS_TOO_LARGE" as const,
    type: "client",
  },
  451: {
    message: "Unavailable For Legal Reasons",
    description:
      "The server is denying access to the resource as a consequence of a legal demand. The server in question might not be an origin server.",
    label: "UNAVAILABLE_FOR_LEGAL_REASONS" as const,
    type: "client",
  },
  418: {
    message: "I'm a teapot",
    description:
      "This code was defined in 1998 as an April Fools' joke and is not expected to be implemented by actual HTTP servers. It is usually returned by teapot-shaped websites or as a humorous error response.",
    label: "IM_A_TEAPOT" as const,
    type: "client",
  },
  420: {
    message: "Enhance Your Calm",
    description:
      "Returned by the Twitter Search and Trends API when the client is being rate limited. Not part of the HTTP standard, but included due to its usage by some services.",
    label: "ENHANCE_YOUR_CALM" as const,
    type: "client",
  },
  427: {
    message: "Too Many Redirects",
    description:
      "The client has encountered too many HTTP redirects and cannot complete the request. This is not an official HTTP status code but is used by some browsers.",
    label: "TOO_MANY_REDIRECTS" as const,
    type: "client",
  },
  430: {
    message: "Request Header Fields Too Large",
    description:
      "This status code is similar to 431, but used by Shopify instead. The server is unwilling to process the request because its header fields are too large.",
    label: "REQUEST_HEADER_FIELDS_TOO_LARGE_SHOPIFY" as const,
    type: "client",
  },
  444: {
    message: "Connection Closed Without Response",
    description:
      "A non-standard status code used by Nginx to indicate that the server has returned no information to the client and closed the connection.",
    label: "CONNECTION_CLOSED_WITHOUT_RESPONSE" as const,
    type: "client",
  },
  449: {
    message: "Retry With",
    description:
      "A Microsoft extension. The request should be retried after performing the appropriate action.",
    label: "RETRY_WITH" as const,
    type: "client",
  },
  450: {
    message: "Blocked by Windows Parental Controls",
    description:
      "A Microsoft extension. This error is given when Windows Parental Controls are turned on and are blocking access to the given webpage.",
    label: "BLOCKED_BY_WINDOWS_PARENTAL_CONTROLS" as const,
    type: "client",
  },
  460: {
    message: "Client Closed Connection",
    description:
      "Used by AWS Elastic Load Balancer to indicate that the client closed the connection with the load balancer before the idle timeout period elapsed.",
    label: "CLIENT_CLOSED_CONNECTION" as const,
    type: "client",
  },
  463: {
    message: "Too Many Forwarded IP Addresses",
    description:
      "Indicates that there are too many forwarded IP addresses in the X-Forwarded-For header.",
    label: "TOO_MANY_FORWARDED_IP_ADDRESSES" as const,
    type: "client",
  },
  494: {
    message: "Request Header Too Large",
    description:
      "Nginx internal code similar to 431 but it was introduced earlier.",
    label: "REQUEST_HEADER_TOO_LARGE" as const,
    type: "client",
  },
  495: {
    message: "SSL Certificate Error",
    description:
      "Nginx internal code used when SSL client certificate error occurred to distinguish it from 4XX in a log and an error page redirection.",
    label: "SSL_CERTIFICATE_ERROR" as const,
    type: "client",
  },
  496: {
    message: "SSL Certificate Required",
    description:
      "Nginx internal code used when client didn't provide certificate to distinguish it from 4XX in a log and an error page redirection.",
    label: "SSL_CERTIFICATE_REQUIRED" as const,
    type: "client",
  },
  497: {
    message: "HTTP Request Sent to HTTPS Port",
    description:
      "Nginx internal code used when the client has sent an HTTP request to a port listening for HTTPS requests.",
    label: "HTTP_REQUEST_SENT_TO_HTTPS_PORT" as const,
    type: "client",
  },
  499: {
    message: "Client Closed Request",
    description:
      "A non-standard status code introduced by nginx for the case when a client closes the connection while nginx is processing the request.",
    label: "CLIENT_CLOSED_REQUEST" as const,
    type: "client",
  },
  500: {
    message: "Internal Server Error",
    description:
      "The server encountered an unexpected condition that prevented it from fulfilling the request. This is a generic error message when no more specific message is suitable.",
    label: "INTERNAL_SERVER_ERROR" as const,
    type: "server",
  },
  501: {
    message: "Not Implemented",
    description:
      "The server does not support the functionality required to fulfill the request. This is the appropriate response when the server does not recognize the request method and is not capable of supporting it for any resource.",
    label: "NOT_IMPLEMENTED" as const,
    type: "server",
  },
  502: {
    message: "Bad Gateway",
    description:
      "The server, while acting as a gateway or proxy, received an invalid response from an inbound server it accessed while attempting to fulfill the request.",
    label: "BAD_GATEWAY" as const,
    type: "server",
  },
  503: {
    message: "Service Unavailable",
    description:
      "The server is currently unable to handle the request due to a temporary overload or scheduled maintenance, which will likely be alleviated after some delay.",
    label: "SERVICE_UNAVAILABLE" as const,
    type: "server",
  },
  504: {
    message: "Gateway Timeout",
    description:
      "The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server it needed to access in order to complete the request.",
    label: "GATEWAY_TIMEOUT" as const,
    type: "server",
  },
  505: {
    message: "HTTP Version Not Supported",
    description:
      "The server does not support, or refuses to support, the major version of HTTP that was used in the request message.",
    label: "HTTP_VERSION_NOT_SUPPORTED" as const,
    type: "server",
  },
  506: {
    message: "Variant Also Negotiates",
    description:
      "The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself, and is therefore not a proper end point in the negotiation process.",
    label: "VARIANT_ALSO_NEGOTIATES" as const,
    type: "server",
  },
  507: {
    message: "Insufficient Storage",
    description:
      "The method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request.",
    label: "INSUFFICIENT_STORAGE" as const,
    type: "server",
  },
  508: {
    message: "Loop Detected",
    description:
      "The server detected an infinite loop while processing the request. This status indicates that the entire operation failed.",
    label: "LOOP_DETECTED" as const,
    type: "server",
  },
  511: {
    message: "Network Authentication Required",
    description:
      "The client needs to authenticate to gain network access. This status is not generated by origin servers, but by intercepting proxies that control access to the network.",
    label: "NETWORK_AUTHENTICATION_REQUIRED" as const,
    type: "client",
  },
  509: {
    message: "Bandwidth Limit Exceeded",
    description:
      "The server has exceeded the bandwidth specified by the server administrator; this is often used by shared hosting providers to limit the bandwidth of customers.",
    label: "BANDWIDTH_LIMIT_EXCEEDED" as const,
    type: "server",
  },
  510: {
    message: "Not Extended",
    description:
      "Further extensions to the request are required for the server to fulfil it.",
    label: "NOT_EXTENDED" as const,
    type: "server",
  },
  520: {
    message: "Web Server Returned an Unknown Error",
    description:
      "The origin server returned an empty, unknown, or unexplained response to Cloudflare.",
    label: "UNKNOWN_ERROR" as const,
    type: "server",
  },
  521: {
    message: "Web Server Is Down",
    description:
      "The origin server has refused the connection from Cloudflare.",
    label: "WEB_SERVER_IS_DOWN" as const,
    type: "server",
  },
  522: {
    message: "Connection Timed Out",
    description:
      "Cloudflare could not negotiate a TCP handshake with the origin server.",
    label: "CONNECTION_TIMED_OUT" as const,
    type: "server",
  },
  523: {
    message: "Origin Is Unreachable",
    description:
      "Cloudflare could not reach the origin server; for example, if the DNS records for the origin server are incorrect.",
    label: "ORIGIN_IS_UNREACHABLE" as const,
    type: "server",
  },
  524: {
    message: "A Timeout Occurred",
    description:
      "Cloudflare was able to complete a TCP connection to the origin server, but did not receive a timely HTTP response.",
    label: "A_TIMEOUT_OCCURRED" as const,
    type: "server",
  },
  525: {
    message: "SSL Handshake Failed",
    description:
      "Cloudflare could not negotiate a SSL/TLS handshake with the origin server.",
    label: "SSL_HANDSHAKE_FAILED" as const,
    type: "server",
  },
  526: {
    message: "Invalid SSL Certificate",
    description:
      "Cloudflare could not validate the SSL certificate on the origin web server.",
    label: "INVALID_SSL_CERTIFICATE" as const,
    type: "server",
  },
  527: {
    message: "Railgun Error",
    description:
      "Error 527 indicates that the request timed out or failed after the WAN connection had been established.",
    label: "RAILGUN_ERROR" as const,
    type: "server",
  },
  530: {
    message: "Origin DNS Error",
    description:
      "Error 530 indicates that the requested host name could not be resolved on the Cloudflare network to an origin server.",
    label: "ORIGIN_DNS_ERROR" as const,
    type: "server",
  },
};

export type HttpErrorStatusCodes = keyof typeof httpErrorStatusCodes;

export type HttpErrorStatusCodeLabels =
  (typeof httpErrorStatusCodes)[keyof typeof httpErrorStatusCodes]["label"];

export const httpStatusCodeLabels = Object.values(httpErrorStatusCodes).map(
  (el) => el.label
) as HttpErrorStatusCodeLabels[];

const getMetadataFromLabel = (label: HttpErrorStatusCodeLabels) => {
  return Object.values(httpErrorStatusCodes).find(
    (value) => value.label === label
  );
};

export const errorStatusCodes = Object.keys(httpErrorStatusCodes).map(
  Number
) as HttpErrorStatusCodes[];

export const validErrorStatusCode = (
  status: number
): status is HttpErrorStatusCodes => {
  return errorStatusCodes.includes(status as HttpErrorStatusCodes);
};
