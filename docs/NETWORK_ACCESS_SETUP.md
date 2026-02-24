# Network Access Setup for Phone Testing

## Problem
When accessing the bartender portal from a phone on the same network, the QR scanner needs camera access, which requires HTTPS.

## Solution Overview
Both the backend and bartender frontend must use HTTPS for network access.

---

## Step-by-Step Setup

### 1. Stop All Running Servers
- Stop backend (Ctrl+C)
- Stop bartender frontend (Ctrl+C)

### 2. Verify SSL Certificates Exist
```bash
cd backend
dir cert.pem
dir key.pem
```

If they don't exist, generate them:
```bash
python generate_cert.py
```

### 3. Start Backend with HTTPS
```bash
cd backend
python main.py
```

**Expected output:**
```
INFO:     Uvicorn running on https://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Important:** It should say `https://` not `http://`

If you see `http://`, the SSL configuration didn't work. Check that `cert.pem` and `key.pem` exist in the backend folder.

### 4. Start Bartender Frontend
```bash
cd frontend-bartender
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   https://localhost:5174/
➜  Network: https://192.168.x.x:5174/
```

**Important:** Both should say `https://`

### 5. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```

Look for "IPv4 Address" (e.g., `192.168.0.105`)

**Mac/Linux:**
```bash
ifconfig
```

### 6. Access from Phone

#### Step A: Accept Frontend Certificate
1. On your phone, open browser
2. Go to: `https://YOUR_IP:5174` (e.g., `https://192.168.0.105:5174`)
3. You'll see "Your connection is not private"
4. Click **Advanced** → **Proceed to [IP] (unsafe)**

#### Step B: Accept Backend Certificate
1. In the same browser, open a new tab
2. Go to: `https://YOUR_IP:8000/docs` (e.g., `https://192.168.0.105:8000/docs`)
3. You'll see another security warning
4. Click **Advanced** → **Proceed to [IP] (unsafe)**
5. You should see the API documentation page

#### Step C: Go Back to App
1. Go back to the bartender portal tab
2. Refresh the page
3. Try to log in
4. The app should now connect to the backend successfully

### 7. Test QR Scanner
1. Log in as a bartender
2. Click "Scan QR"
3. Browser will ask for camera permission
4. Click **Allow**
5. Camera should now work!

---

## Troubleshooting

### Issue: Backend shows `http://` not `https://`

**Cause:** SSL certificates missing or backend not configured correctly

**Fix:**
1. Check if `cert.pem` and `key.pem` exist in backend folder
2. If not, run: `python generate_cert.py`
3. Verify `main.py` has SSL configuration:
   ```python
   uvicorn.run(
       "main:app",
       host="0.0.0.0",
       port=8000,
       reload=True,
       ssl_keyfile="key.pem",
       ssl_certfile="cert.pem"
   )
   ```
4. Restart backend

### Issue: "NET::ERR_CERT_AUTHORITY_INVALID"

**Cause:** Self-signed certificate not trusted

**Fix:** This is expected! Click "Advanced" → "Proceed anyway"

You must do this for BOTH:
- Frontend (port 5174)
- Backend (port 8000)

### Issue: "Mixed Content" Error

**Cause:** Frontend is HTTPS but trying to call HTTP backend

**Fix:** Make sure backend is running with HTTPS (see above)

### Issue: Camera Still Not Working

**Possible causes:**
1. Didn't accept backend certificate - Visit `https://YOUR_IP:8000/docs` and accept
2. Browser doesn't support camera on self-signed cert - Try Chrome or Safari
3. Camera permission denied - Check browser settings

### Issue: "Connection Refused" or "Network Error"

**Possible causes:**
1. Backend not running - Check backend terminal
2. Wrong IP address - Verify with `ipconfig`
3. Firewall blocking - Temporarily disable firewall to test
4. Not on same network - Phone and computer must be on same WiFi

---

## Verification Checklist

Before testing on phone:

- [ ] Backend running with HTTPS (`https://0.0.0.0:8000`)
- [ ] Bartender frontend running with HTTPS (`https://localhost:5174`)
- [ ] SSL certificates exist (`cert.pem`, `key.pem`)
- [ ] Know your computer's IP address
- [ ] Phone and computer on same WiFi network

On phone:

- [ ] Accepted frontend certificate (port 5174)
- [ ] Accepted backend certificate (port 8000)
- [ ] Can see login page
- [ ] Can log in successfully
- [ ] Camera permission granted
- [ ] QR scanner works

---

## For Local Development (Same Machine)

If you're testing on the same machine (not phone), you can use HTTP:

1. Comment out SSL in `backend/main.py`:
   ```python
   uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
   # Don't include ssl_keyfile and ssl_certfile
   ```

2. Comment out `basicSsl()` in `frontend-bartender/vite.config.ts`

3. Access via `http://localhost:5174`

Camera will work on localhost even with HTTP!

---

## Production Deployment

For production, use proper SSL certificates from Let's Encrypt or a certificate authority, not self-signed certificates.

---

**Last Updated:** February 21, 2026
