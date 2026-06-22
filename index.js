
const fs = require("fs");
const readline = require("readline");

const DATA_FILE = "bookings.json";

const huts = [
    {
        id: 1,
        name: "Mintaro Hut",
        walk: "Milford Track",
        capacity: 40
    },
    {
        id: 2,
        name: "Clinton Hut",
        walk: "Milford Track",
        capacity: 40
    },
    {
        id: 3,
        name: "Iris Burn Hut",
        walk: "Kepler Track",
        capacity: 50
    }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Load bookings
function loadBookings() {
    try {

        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }

        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data);

    } catch (error) {

        console.log("Data file missing or corrupt.");
        return [];
    }
}

let bookings = loadBookings();

// Save bookings
function saveBookings() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(bookings, null, 2)
    );
}

// Validation
function validateBooking(name, date, nights, partySize) {

    if (!name.trim()) {
        return "Name cannot be empty.";
    }

    const arrivalDate = new Date(date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (
        isNaN(arrivalDate.getTime()) ||
        arrivalDate < today
    ) {
        return "Invalid date.";
    }

    if (
        !Number.isInteger(nights) ||
        nights <= 0
    ) {
        return "Nights must be a positive whole number.";
    }

    if (
        !Number.isInteger(partySize) ||
        partySize <= 0
    ) {
        return "Party size must be a positive whole number.";
    }

    return null;
}

// Capacity check
function canFitBooking(
    hut,
    arrivalDate,
    nights,
    partySize
) {

    const startDate = new Date(arrivalDate);

    for (let i = 0; i < nights; i++) {

        const currentNight = new Date(startDate);
        currentNight.setDate(
            startDate.getDate() + i
        );

        let occupied = 0;

        for (let booking of bookings) {

            if (booking.hutId !== hut.id) {
                continue;
            }

            const bookingStart =
                new Date(booking.arrivalDate);

            const bookingEnd =
                new Date(bookingStart);

            bookingEnd.setDate(
                bookingStart.getDate() +
                booking.nights
            );

            if (
                currentNight >= bookingStart &&
                currentNight < bookingEnd
            ) {
                occupied += booking.partySize;
            }
        }

        if (
            occupied + partySize >
            hut.capacity
        ) {
            return false;
        }
    }

    return true;
}

// Add booking
function addBooking() {

    console.log("\nAvailable Huts");

    huts.forEach(hut => {
        console.log(
            `${hut.id}. ${hut.name} (${hut.capacity} bunks)`
        );
    });

    rl.question("Enter Hut ID: ", hutInput => {

        const hut = huts.find(
            h => h.id === Number(hutInput)
        );

        if (!hut) {
            console.log("Hut not found.");
            return menu();
        }

        rl.question("Tramper Name: ", name => {

            rl.question(
                "Arrival Date (YYYY-MM-DD): ",
                date => {

                    rl.question(
                        "Number of Nights: ",
                        nightsInput => {

                            rl.question(
                                "Party Size: ",
                                partyInput => {

                                    const nights =
                                        Number(nightsInput);

                                    const partySize =
                                        Number(partyInput);

                                    const error =
                                        validateBooking(
                                            name,
                                            date,
                                            nights,
                                            partySize
                                        );

                                    if (error) {
                                        console.log(error);
                                        return menu();
                                    }

                                    if (
                                        !canFitBooking(
                                            hut,
                                            date,
                                            nights,
                                            partySize
                                        )
                                    ) {
                                        console.log(
                                            "Booking exceeds hut capacity."
                                        );
                                        return menu();
                                    }

                                    bookings.push({
                                        id: Date.now(),
                                        hutId: hut.id,
                                        tramperName: name,
                                        arrivalDate: date,
                                        nights: nights,
                                        partySize: partySize
                                    });

                                    saveBookings();

                                    console.log(
                                        "Booking added successfully."
                                    );

                                    menu();
                                }
                            );
                        }
                    );
                }
            );
        });
    });
}

// View bookings
function viewBookings() {

    if (bookings.length === 0) {
        console.log("No bookings found.");
        return menu();
    }

    bookings.forEach(booking => {

        const hut = huts.find(
            h => h.id === booking.hutId
        );

        console.log(`
Booking ID: ${booking.id}
Name: ${booking.tramperName}
Hut: ${hut.name}
Arrival Date: ${booking.arrivalDate}
Nights: ${booking.nights}
Party Size: ${booking.partySize}
`);
    });

    menu();
}

// Cancel booking
function cancelBooking() {

    rl.question(
        "Enter Booking ID: ",
        bookingId => {

            const index =
                bookings.findIndex(
                    booking =>
                        booking.id === Number(bookingId)
                );

            if (index === -1) {

                console.log(
                    "Booking not found."
                );

            } else {

                bookings.splice(index, 1);

                saveBookings();

                console.log(
                    "Booking cancelled."
                );
            }

            menu();
        }
    );
}

// Occupancy summary
function occupancySummary() {

    console.log("\nOccupancy Summary");

    huts.forEach(hut => {

        let totalPeople = 0;

        bookings.forEach(booking => {

            if (booking.hutId === hut.id) {
                totalPeople += booking.partySize;
            }
        });

        console.log(
            `${hut.name}: ${totalPeople}/${hut.capacity} bunks occupied`
        );
    });

    menu();
}

// Menu
function menu() {

    console.log(`
=========================
DOC HUT BOOKING MANAGER
=========================

1. Add Booking
2. View Bookings
3. Cancel Booking
4. Occupancy Summary
5. Exit
`);

    rl.question(
        "Choose an option: ",
        choice => {

            switch (choice) {

                case "1":
                    addBooking();
                    break;

                case "2":
                    viewBookings();
                    break;

                case "3":
                    cancelBooking();
                    break;

                case "4":
                    occupancySummary();
                    break;

                case "5":
                    console.log("Goodbye!");
                    rl.close();
                    break;

                default:
                    console.log(
                        "Invalid option."
                    );
                    menu();
            }
        }
    );
}

menu();

