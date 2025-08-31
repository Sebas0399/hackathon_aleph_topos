# Web3.Storage fallback

This file explains how to use the Web3.Storage HTTP upload fallback implemented in `src/utils/filecoinStorage.web3.js`.

1. Get an API token from https://web3.storage by creating an account and generating an API key.
2. Add the key to your frontend `.env` file in the `frontend` folder:

```
VITE_WEB3STORAGE_TOKEN=YOUR_API_KEY_HERE
```

3. Use the functions:

- `uploadSingleFileWeb3(file)` - returns CID string
- `uploadMultipleFilesWeb3(filesArray)` - returns CID string

4. Example usage from `ProductRegistrationNew.jsx`:

```js
import { uploadSingleFileWeb3 } from '../utils/filecoinStorage.web3'

const cid = await uploadSingleFileWeb3(file)
```

Notes:
- This is an HTTP-based alternative and does not use Storacha UCANs.
- Data uploaded to Web3.Storage will be available on IPFS and may be pinned/to-be-stored by Filecoin depending on your account.
- Keep your API token secret; in a frontend app this exposes the token to users — prefer server-side uploads for production.
