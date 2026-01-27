import Event from "../Models/eventSchema.js";
import Booking from "../Models/bookingSchema.js";

//Create Event
export const createEvent = async (req, res) => {
  //console.log(req);

  try {
    const organizerId = req.user._id; // from auth middleware
    let imageUrl = "";
    //if file uploaded then upload to cloudinary
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }
    const tickets = req.body.tickets ? JSON.parse(req.body.tickets) : [];

    const location = req.body.location ? JSON.parse(req.body.location) : {};

    const event = await Event.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isOnline: req.body.isOnline,
      onlineLink: req.body.onlineLink,

      location,
      tickets,

      bannerImage: imageUrl,
      organizer: organizerId,
    });

    res
      .status(200)
      .json({ message: "Event created successfully", data: event });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Cannot create event Error in Create Event ${error}` });
  }
};

// Get All Events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isDeleted: false,
    })
      .populate("organizer", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// Get All Published Events
export const getAllPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "published",
      isDeleted: false,
    })
      .populate("organizer", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

// Event by Id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

// Get my Events
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizer: req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer events",
      error: error.message,
    });
  }
};
// Update Event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
      isDeleted: false,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }
    // 🔥 Parse tickets & location safely
    let tickets = event.tickets;
    let location = event.location;

    if (req.body.tickets) {
      tickets = JSON.parse(req.body.tickets);
    }

    if (req.body.location) {
      location = JSON.parse(req.body.location);
    }

    //  Update scalar fields explicitly
    event.title = req.body.title ?? event.title;
    event.description = req.body.description ?? event.description;
    event.category = req.body.category ?? event.category;
    event.startDate = req.body.startDate ?? event.startDate;
    event.endDate = req.body.endDate ?? event.endDate;
    event.isOnline =
      req.body.isOnline !== undefined ? req.body.isOnline : event.isOnline;
    event.onlineLink = req.body.onlineLink ?? event.onlineLink;

    //  Assign parsed objects
    event.tickets = tickets;
    event.location = location;

    //  Update image only if uploaded
    if (req.file && req.file.path) {
      event.bannerImage = req.file.path;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

//Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        organizer: req.user._id,
      },
      { isDeleted: true },
      { new: true },
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

// Update Event Status
export const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "published", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        /* organizer: req.user._id, */
      },
      { status },
      { new: true },
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: `Event ${status} successfully`,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event status",
      error: error.message,
    });
  }
};

export const getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookings = await Booking.find({
      event: eventId,
      paymentStatus: "paid",
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    const attendees = bookings.map((booking) => ({
      bookingId: booking._id,
      name: booking.user.name,
      email: booking.user.email,
      profileImage: booking.user.profileImage,
      tickets: booking.quantity,
      totalAmount: booking.totalAmount,
      bookedAt: booking.createdAt,
    }));

    res.status(200).json({
      success: true,
      attendees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendees",
      error: error.message,
    });
  }
};

// Get Event with available Tickets

export const getEventWithAvailability = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Aggregate only VALID bookings
    const bookingsByType = await Booking.aggregate([
      {
        $match: {
          event: event._id,
          bookingStatus: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: { $toUpper: { $trim: { input: "$ticketType" } } },
          totalBooked: { $sum: "$quantity" },
        },
      },
    ]);

    // Convert to map
    const bookedMap = {};
    bookingsByType.forEach((b) => {
      bookedMap[b._id] = b.totalBooked;
    });

    // Calculate availability
    const ticketAvailability = event.tickets.map((ticket) => {
      const normalizedType = ticket.ticketType.trim().toUpperCase();
      const booked = bookedMap[normalizedType] || 0;
      const available = Math.max(ticket.quantity - booked, 0);

      return {
        ticketType: ticket.ticketType,
        price: ticket.price,
        totalTickets: ticket.quantity,
        bookedTickets: booked,
        availableTickets: available,
      };
    });

    res.status(200).json({
      success: true,
      event: event,
      title: event.title,
      ticketAvailability,
    });
  } catch (error) {
    console.error("Availability error:", error);
    res.status(500).json({ message: error.message });
  }
};
