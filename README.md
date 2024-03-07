#### Eco Smart Bins
The Eco Smart Bins project aims to develop a Smart Waste Management System website, leveraging modern technologies to enhance waste collection efficiency, promote recycling, and provide an interactive platform for residents, waste management staff, and administrators.


#### To see the website EcoSmart Bins
# Development Site: https://ecosmart-bins-server-side.onrender.com


# Frameworks and Libraries:
The Eco Smart Bins project is a server-side application built using Node.js and Express.js, designed to manage and control eco-friendly smart waste bins. The project utilizes various npm packages to achieve its functionality:

1. **cors**: This package enables Cross-Origin Resource Sharing (CORS) to allow communication between the server and clients from different origins securely.

2. **dotenv**: dotenv is used for loading environment variables from a .env file into process.env, allowing configuration settings to be kept separate from code and easily managed.

3. **express**: Express.js is a popular web application framework for Node.js, utilized in this project for handling HTTP requests, routing, and middleware.

4. **form-data**: form-data is a library for creating form data objects, which is useful for sending form-encoded data in HTTP requests.

5. **jsonwebtoken**: This package is used for generating and verifying JSON Web Tokens (JWTs), enabling secure authentication and authorization mechanisms in the application.

6. **mailgun.js**: mailgun.js is a client library for the Mailgun email service, used for sending transactional emails such as notifications and alerts from the application.

7. **mongodb**: MongoDB is a NoSQL database used in this project for storing and managing data related to smart waste bins, users, and other application entities.

8. **recharts**: Recharts is a charting library for React applications, utilized for generating dynamic and interactive charts such as line charts and pie charts to visualize data.

9. **socket.io**: socket.io is a library for enabling real-time bidirectional communication between clients and servers using WebSockets. It is used in this project for implementing real-time features such as live updates and notifications.

10. **sslcommerz-lts**: sslcommerz-lts is a package for integrating SSLCommerz, a payment gateway service, into the application for handling secure online payments.

Overall, the Eco Smart Bins project leverages these npm packages to create a robust and feature-rich server-side application for managing eco-friendly smart waste bins, providing functionalities such as authentication, data storage, real-time communication, and visualization of data through charts.

#### Run the project Process

## Guidelines

1. **Clone the Repository:** Clone the project repository to your local development environment using the following command:
   ```
   git clone https://github.com/Raisul-24/EcoSmart-Bins-Server-Side.git
   ```
2. **Run the command:** Open your termonal and run this command:
   ```
   npm i
   ```
   or
   ```
   yarn
   ```
3. **Create .env file:** After creating .env file and paste these code and save it.
   ```
   DB_USER=EcoSmartBins
   DB_PASS=sb2XodBRu2p5Qjxi
   ACCESS_TOKEN_SECRET=11c6909de0cff9641191eda417156a3299553265cc349c3063654241ae26ff6c
   MICROSOFT_APP_ID=5d8e7dc6-cb2e-49d0-a0d1-be0cd946ebfc
   MICROSOFT_APP_PASSWORD=YfJ8Q~9qlvcPj-zxlvgSrs.jMpgU1oOu~E4viaCe
   STORE_ID=cdjkj65ca36cc656de
   STORE_PASSWORD=cdjkj65ca36cc656de@ssl
   MAIL_GUN_API_KEY=30bdeaca6705ac037002348a364dbe66-2c441066-bfea4420
   MAIL_SENDING_DOMAIN=sandbox46554d9e079740e1a0ba77a562348465.mailgun.org
   ```
4. **Run the project:** For run this project need to run this command
   ```
   nodemon index.js
   ```

<!-- ------------------DEVELOPED BY Team-Unbeaten------------------- -->

Thanks again!

