<script>
  let iv = "",
    message = "",
    password = "",
    length = 10;

  let hex = "",
    bin = "";

  function encrypt() {
    iv = iv || "key";
    message = message || "message";
    password = password || "password";
    console.log("Encrypting...");

    const HASH = forge.md.sha1.create();
    HASH.update(message);
    console.log(`${message} \n -(SHA1)->\n${HASH.digest().toHex()}`);

    const CIPHER = forge.rc2.createEncryptionCipher(password);
    CIPHER.start(iv);
    CIPHER.update(forge.util.createBuffer(HASH.digest().data));
    CIPHER.finish();
    console.log(
      `${HASH.digest().toHex()} \n -(RC2)->\n${CIPHER.output.toHex()}`
    );
    hex = `${CIPHER.output.toHex().substring(0, length)} / ${CIPHER.output
      .toHex()
      .substring(length)}`;
    bin = CIPHER.output.data;
  }

  function decrypt() {
    iv = iv || "key";
    message = message || "message";
    password = password || "password";
    console.log("Decrypting...");

    const CIPHER = forge.rc2.createDecryptionCipher(password);
    CIPHER.start(iv);
    CIPHER.update(forge.util.createBuffer(forge.util.hexToBytes(message)));
    CIPHER.finish();
    hex = CIPHER.output.toHex();
    bin = CIPHER.output.data;
  }
</script>

<form>
  <h1>SHA1 -> RC2</h1>
  <input bind:value={iv} type="password" placeholder="Key" />
  <input bind:value={message} placeholder="Message" />
  <input bind:value={password} type="password" placeholder="Password" />
  <input bind:value={length} type="number" min="1" max="48"/>
  <input on:click|preventDefault={encrypt} type="submit" value="Encrypt" />
  <input on:click|preventDefault={decrypt} type="submit" value="Decrypt" />
  <hr />
  <output>{hex}</output>
  <output>{bin}</output>
  <footer>
    By <a href="https://www.claytonleonardcook.com">Clayton Cook</a> using Svelte
  </footer>
</form>

<style>
  form {
    width: clamp(250px, 50vw, 600px);
    height: fit-content;
    padding: 30px;
    margin: auto auto;
  }
  input {
    width: 100%;
    display: block;
  }
  output {
    display: inline-block;
    width: 100%;
    overflow-x: scroll;
    padding: 5px 0;
  }
  output:nth-child(2) {
    color: red;
  }
  footer {
    font-size: small;
    font-weight: bold;
    padding: 15px 0;
  }
</style>
