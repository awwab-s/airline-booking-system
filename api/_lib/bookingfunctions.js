// Vercel version of php/bookingfunctions.php (same functions, same logic)

// Function to generate a random 3-digit number from 100 to 999
function generateRandomNumber() {
    return mt_rand(100, 999);
}

// Check if the generated booking reference exists in the database
async function isUniqueReference($reference, $conn) {
    let $sql = `SELECT * FROM booking WHERE booking_reference = '${$reference}'`;
    let $result = await $conn.query($sql);

    return $result.num_rows === 0;
}

// Generate a unique booking reference
async function generateBookingReference($conn) {
    let $uniqueReference = generateRandomNumber();

    // Check if the generated reference already exists, generate until unique
    while (!(await isUniqueReference($uniqueReference, $conn))) {
        $uniqueReference = generateRandomNumber();
    }

    return $uniqueReference;
}

const { mt_rand } = require('./php');
module.exports = { generateRandomNumber, isUniqueReference, generateBookingReference };
