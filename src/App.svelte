<script lang="ts">
  const ALPHABET: string =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

  let firstName: string = "",
    middleName: string = "",
    lastName: string = "",
    service: string = "",
    username: string = "",
    password: string = "",
    length: number = 10;

  function encrypt() {
    const SUBTLECRYPTO = new SubtleCrypto();
    const ENCODER = new TextEncoder();
    console.log("Encrypting...");

    const encodedFirstName = ENCODER.encode(firstName.toLowerCase()),
      encodedMiddleName = ENCODER.encode(middleName.toLowerCase()),
      encodedLastName = ENCODER.encode(lastName.toLowerCase()),
      encodedService = ENCODER.encode(service.toLowerCase()),
      encodedUsername = ENCODER.encode(username),
      encodedPassword = ENCODER.encode(password);

    console.log([
      SUBTLECRYPTO.digest("SHA-256", encodedFirstName),
      SUBTLECRYPTO.digest("SHA-256", encodedMiddleName),
      SUBTLECRYPTO.digest("SHA-256", encodedLastName),
      SUBTLECRYPTO.digest("SHA-256", encodedService),
      SUBTLECRYPTO.digest("SHA-256", encodedUsername),
      SUBTLECRYPTO.digest("SHA-256", encodedPassword),
    ]);

    // const HASH = forge.md.sha1.create();
    // HASH.update(message);
    // console.log(`${message} \n -(SHA1)->\n${HASH.digest().toHex()}`);

    // const CIPHER = forge.rc2.createEncryptionCipher(password);
    // CIPHER.start(iv);
    // CIPHER.update(forge.util.createBuffer(HASH.digest().data));
    // CIPHER.finish();
    // console.log(
    //   `${HASH.digest().toHex()} \n -(RC2)->\n${CIPHER.output.toHex()}`
    // );
    // hex = `${CIPHER.output.toHex().substring(0, length)} / ${CIPHER.output
    //   .toHex()
    //   .substring(length)}`;
    // bin = CIPHER.output.data;
  }
</script>

<form on:submit|preventDefault={encrypt}>
  <h1>SHA1 -> RC2</h1>
  <input
    type="text"
    placeholder="First Name"
    autocomplete="given-name"
    required
  />
  <input
    type="text"
    placeholder="Middle Name"
    autocomplete="additional-name"
    required
  />
  <input
    type="text"
    placeholder="Last Name"
    autocomplete="family-name"
    required
  />
  <input type="text" placeholder="Service" required />
  <input type="text" placeholder="Username" />

  <input bind:value={length} type="number" min="1" max="48" />
  <input on:click|preventDefault={encrypt} type="submit" value="Encrypt" />
  <hr />
  <!-- <output>{hex}</output>
  <output>{bin}</output> -->
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
