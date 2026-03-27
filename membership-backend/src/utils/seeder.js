import bcrypt from "bcrypt";
import "../config/env.js";
import {
  sequelize,
  Admin,
  Member,
  Setting,
  Region,
} from "../database/index.js";
import { testDbConnection } from "../config/database.js";

const seedDatabase = async () => {
  try {
    await testDbConnection();
    await sequelize.sync({ alter: true });

    const memberDefaults = {
      dateOfBirth: "1990-01-01",
      permanentAddress: "Raipur",
      currentAddress: "Raipur",
    };

    // 1. Seed Admin
    const adminPhone = process.env.SEED_ADMIN_PHONE_NUMBER;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        "Missing SEED_ADMIN_PASSWORD. Refusing to seed a default admin without an explicit password.",
      );
    }

    if (!adminPhone) {
      throw new Error(
        "Missing SEED_ADMIN_PHONE_NUMBER. Refusing to seed a default admin without an explicit phone number.",
      );
    }

    const existingAdmin = await Admin.findOne({
      where: { phoneNumber: adminPhone },
    });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await Admin.create({
        phoneNumber: adminPhone,
        password: hashedPassword,
      });
      console.log("✅ Default Admin created.", {
        phoneNumber: adminPhone,
      });
    }

    // 2. Seed President (Added Dummy Mobile Number)
    const presidentEmail = "president@maharashtramandal.com";
    const existingPresident = await Member.findOne({
      where: { role: "PRESIDENT" },
    });
    if (!existingPresident) {
      await Member.create({
        ...memberDefaults,
        name: "Shri President",
        email: presidentEmail,
        mobileNumber: "9000000001", // NEW: Unique mobile number
        role: "PRESIDENT",
      });
      console.log("✅ Default President created.");
    }

    // 3. Seed Multiple Proposer Members (Added Dummy Mobile Numbers)
    const initialMembers = [
      {
        ...memberDefaults,
        name: "Aman Singh",
        email: "aman@maharashtramandal.com",
        mobileNumber: "9000000002", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        ...memberDefaults,
        name: "Rahul Sharma",
        email: "rahul@maharashtramandal.com",
        mobileNumber: "9000000003", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        ...memberDefaults,
        name: "Priya Deshmukh",
        email: "priya@maharashtramandal.com",
        mobileNumber: "9000000004", // NEW: Unique mobile number
        role: "MEMBER",
      },
      {
        ...memberDefaults,
        name: "Vikram Joshi",
        email: "vikram@maharashtramandal.com",
        mobileNumber: "9000000005", // NEW: Unique mobile number
        role: "MEMBER",
      },
    ];

    for (const memberData of initialMembers) {
      const existingMember = await Member.findOne({
        where: { email: memberData.email },
      });
      if (!existingMember) {
        await Member.create(memberData);
        console.log(`✅ Member created: ${memberData.name}`);
      }
    }

    console.log("⚙️ Setting up default system settings...");
    await Setting.upsert({
      key: "LIFETIME_MEMBERSHIP_FEE",
      value: "1510",
    });
    console.log("✅ Default Membership Fee set to 1510.");

    // --- SEED DEFAULT RAIPUR REGIONS ---
    const defaultRegions = [
      "Tatibandh",
      "Shankar Nagar",
      "Telibandha",
      "Gudhiyari",
      "Katora Talab",
      "Devendra Nagar",
      "Samta Colony",
      "Saddu",
      "Avanti Vihar",
      "Rajendra Nagar",
    ];

    for (const regionName of defaultRegions) {
      await Region.findOrCreate({
        where: { name: regionName },
        defaults: { isActive: true },
      });
    }
    console.log("✅ Regions seeded successfully!");

    console.log("🌱 Seeding complete! You can now start your server.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
