import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
dotenv.config();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Thrive Dashboard Backend API',
            version: '1.0.0',
            description: 'API documentation for HRMS Temp Backend'
        },
        servers: [
            {
                url: 'http://localhost:' + (process.env.PORT || 5020)
            },
            {
                url: "https://worklyticsapi.thrivebrands.ai"
            }
        ]
    },
    apis: [
        './User/Routes/*.js',
        './app.js'
    ]
};

const swaggerSpec = swaggerJSDoc(options);

// Backward-compatible named exports used by existing app.js
export { swaggerUi, swaggerSpec };

// Default export: setup function, following the reference pattern
const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;


