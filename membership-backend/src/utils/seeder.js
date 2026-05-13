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

    // Sync database
    await sequelize.sync({ alter: true });

    // ================================
    // 1. Seed Admin
    // ================================
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPhone = process.env.SEED_ADMIN_PHONE_NUMBER;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminEmail) {
      throw new Error(
        "Missing SEED_ADMIN_EMAIL. Refusing to seed a default admin without an explicit email.",
      );
    }

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
        email: adminEmail,
        phoneNumber: adminPhone,
        password: hashedPassword,
      });

      console.log("✅ Default Admin created.", {
        email: adminEmail,
        phoneNumber: adminPhone,
      });
    } else {
      console.log("ℹ️ Admin already exists.");
    }

    // ================================
    // 2. Seed President
    // ================================
    const presidentEmail = "president@maharashtramandal.com";

    const existingPresident = await Member.findOne({
      where: { role: "PRESIDENT" },
    });

    if (!existingPresident) {
      await Member.create({
        name: "Shri President",
        email: presidentEmail,
        mobileNumber: "9000000001",
        dateOfBirth: "1975-01-01",
        bloodGroup: "O+",
        permanentAddress: "Raipur, Chhattisgarh",
        currentAddress: "Raipur, Chhattisgarh",
        role: "PRESIDENT",
        isActive: true,
      });

      console.log("✅ Default President created.");
    } else {
      console.log("ℹ️ President already exists.");
    }

    // ================================
    // 3. Seed Initial Members
    // ================================
    const initialMembers = [
      {
        name: "Aman Singh",
        email: "aman@maharashtramandal.com",
        mobileNumber: "9000000002",
        dateOfBirth: "1998-05-12",
        bloodGroup: "B+",
        permanentAddress: "Raipur, Chhattisgarh",
        currentAddress: "Raipur, Chhattisgarh",
        role: "MEMBER",
        isActive: true,
      },
      {
        name: "Rahul Sharma",
        email: "rahul@maharashtramandal.com",
        mobileNumber: "9000000003",
        dateOfBirth: "1992-08-20",
        bloodGroup: "O+",
        permanentAddress: "Bilaspur, Chhattisgarh",
        currentAddress: "Raipur, Chhattisgarh",
        role: "MEMBER",
        isActive: true,
      },
      {
        name: "Priya Deshmukh",
        email: "priya@maharashtramandal.com",
        mobileNumber: "9000000004",
        dateOfBirth: "1995-03-15",
        bloodGroup: "A+",
        permanentAddress: "Nagpur, Maharashtra",
        currentAddress: "Raipur, Chhattisgarh",
        role: "MEMBER",
        isActive: true,
      },
      {
        name: "Vikram Joshi",
        email: "vikram@maharashtramandal.com",
        mobileNumber: "9000000005",
        dateOfBirth: "1988-11-10",
        bloodGroup: "AB+",
        permanentAddress: "Pune, Maharashtra",
        currentAddress: "Raipur, Chhattisgarh",
        role: "MEMBER",
        isActive: true,
      },
    ];

    for (const memberData of initialMembers) {
      const existingMember = await Member.findOne({
        where: { email: memberData.email },
      });

      if (!existingMember) {
        await Member.create(memberData);
        console.log(`✅ Member created: ${memberData.name}`);
      } else {
        console.log(`ℹ️ Member already exists: ${memberData.name}`);
      }
    }

    // ================================
    // 4. Seed System Settings
    // ================================
    console.log("⚙️ Setting up default system settings...");

    await Setting.upsert({
      key: "LIFETIME_MEMBERSHIP_FEE",
      value: "1510",
    });

    console.log("✅ Default Membership Fee set to 1510.");

    // ================================
    // 5. Seed Default Regions
    // ================================
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
        defaults: {
          isActive: true,
        },
      });
    }

    console.log("✅ Regions seeded successfully!");

    // ================================
    // Completed
    // ================================
    console.log("🌱 Seeding complete! You can now start your server.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
