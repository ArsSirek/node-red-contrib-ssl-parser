const https = require('node:https');

module.exports = function(RED) {
	function sslParser(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		node.on('input', function (msg) {
			node.status({
				fill: "orange",
				shape: "dot",
				text: `requesting ssl`,
			});

			const options = {
				hostname: msg[config.domain_field],
				port: 443,
				method: 'GET',
			};
			const req = https.request(options, (res) => {

				let certificate = res.socket.getPeerCertificate();
				// Rest of your code to extract and handle the certificate information
				const payload = {};
				payload.subject = certificate.subject;
				payload.issuer = certificate.issuer;
				payload.subjectAlternativeName = certificate.subjectaltname;
				payload.publicKey = certificate.pubkey;
				payload.validFrom = certificate.valid_from;
				payload.validTo = certificate.valid_to;
				payload.serialNumber = certificate.serialNumber;
				payload.derCertificate = certificate.raw;
				// Get the certificate in DER format
				let prefix = '-----BEGIN CERTIFICATE-----\n';
				let postfix = '-----END CERTIFICATE-----';
				payload.pemCertificate = prefix + certificate.raw.toString('base64').match(/.{0,64}/g).join('\n') + postfix;

				payload.validToTimestamp = new Date(certificate.valid_to).getTime();
				payload.validFromTimestamp = new Date(certificate.valid_from).getTime();

				let now = new Date().getTime();
				payload.daysRemaining = Math.round((payload.validToTimestamp - now) / 8.64e7);
				payload.status = 'success';

				msg.payload = payload;
				node.send(msg);
				node.status({
					fill: "green",
					shape: "dot",
					text: `response received`,
				});
			});

			req.on('error', (err) => {
				if (err.message === 'Error: certificate has expired') {
					node.send({
						status: 'expired',
					});
				} else {
					node.send({
						status: 'fail',
						message: err.message,
					});
					node.error(err);
				}
			});

			req.end();


		});
	}

	RED.nodes.registerType("ssl-parser", sslParser);
}
