# Backend_HustlePe

The backend implementation for the HustlePe platform

## Getting Started

1. **Clone the repository**  
   ```bash
   git clone <repo-url>
   cd Backend_HustlePe
   ```

2. **Environment Variables**  
   Copy the sample environment file and fill in your secrets:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and provide values for:
   - `ACCESS_TOKEN_SECRET` and `ACCESS_REFRESH_TOKEN`: Generate strong random strings for JWT secrets.
   - `MONGODB_URI`: Your MongoDB connection string.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Get these from your [Cloudinary dashboard](https://cloudinary.com/).
   - `STRIPE_API_KEY`: Get this from your [Stripe dashboard](https://dashboard.stripe.com/apikeys).
   - Adjust `PORT`, `CORS_ORIGIN`, and expiry values as needed.

3. **Start with Docker**  
   Build and run the containers:
   ```bash
   docker compose build
   docker compose up
   ```

The server should now be running and connected to your configured services.