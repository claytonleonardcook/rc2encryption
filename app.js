const IV = document.querySelector('input#iv'),
    MESSAGE = document.querySelector('input#message'),
    SECRETPASSWORD = document.querySelector('input#secretpassword'),
    ENCRYPT = document.querySelector('button#encrypt'),
    DECRYPT = document.querySelector('button#decrypt'),
    HEXOUTPUT = document.querySelector('output.hex'),
    BINARYOUTPUT = document.querySelector('output.binary');

let iv = "somekindofkey";
IV.value = iv;

IV.addEventListener('input', (e) => {
    iv = e.target.value;
})

ENCRYPT.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const HASH = forge.md.sha1.create();
    HASH.update(MESSAGE.value);
    console.log(`${MESSAGE.value} \n -(SHA1)->\n${HASH.digest().toHex()}`);

    const CIPHER = forge.rc2.createEncryptionCipher(SECRETPASSWORD.value);
    CIPHER.start(iv);
    CIPHER.update(forge.util.createBuffer(HASH.digest().data));
    CIPHER.finish();
    console.log(`${HASH.digest().toHex()} \n -(RC2)->\n${CIPHER.output.toHex()}`);
    BINARYOUTPUT.textContent = `${CIPHER.output.data}`;
    HEXOUTPUT.textContent = `${CIPHER.output.toHex()}`;

})

DECRYPT.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const CIPHER = forge.rc2.createDecryptionCipher(SECRETPASSWORD.value);
    CIPHER.start(iv);
    CIPHER.update(forge.util.createBuffer(forge.util.hexToBytes(MESSAGE.value)));
    CIPHER.finish();
    BINARYOUTPUT.textContent = `${CIPHER.output.data}`;
    HEXOUTPUT.textContent = `${CIPHER.output.toHex()}`;
})