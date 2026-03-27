# Naming Dictionary (Strict)

This backend uses **camelCase in JavaScript** and **snake_case in MySQL**.

Sequelize is configured with `underscored: true`, so camelCase attributes map automatically to snake_case columns.

## Rules

- **JS/Node code (controllers/services/repos/models):** 100% camelCase.
- **Database schema (tables/columns):** snake_case.
- **API compatibility during migration:** DTOs may accept legacy snake_case inputs, but they must **normalize** into camelCase via Joi `rename()` before reaching controllers/services.

## Core field mappings

### Common

| JavaScript (canonical) | Database column |
| ---------------------- | --------------- |
| `createdAt`            | `created_at`    |
| `updatedAt`            | `updated_at`    |

### Foreign keys

| JavaScript (canonical) | Database column      |
| ---------------------- | -------------------- |
| `applicantId`          | `applicant_id`       |
| `proposerMemberId`     | `proposer_member_id` |

### Applicant (`applicants`)

| JavaScript (canonical) | Database column          |
| ---------------------- | ------------------------ |
| `registrationNumber`   | `registration_number`    |
| `fullName`             | `full_name`              |
| `fatherOrHusbandName`  | `father_or_husband_name` |
| `permanentAddress`     | `permanent_address`      |
| `currentAddress`       | `current_address`        |
| `isFromRaipur`         | `is_from_raipur`         |
| `mobileNumber`         | `mobile_number`          |
| `officeAddress`        | `office_address`         |
| `dateOfBirth`          | `date_of_birth`          |
| `marriageDate`         | `marriage_date`          |
| `bloodGroup`           | `blood_group`            |
| `membershipType`       | `membership_type`        |

### Member (`members`)

| JavaScript (canonical) | Database column     |
| ---------------------- | ------------------- |
| `mobileNumber`         | `mobile_number`     |
| `dateOfBirth`          | `date_of_birth`     |
| `bloodGroup`           | `blood_group`       |
| `permanentAddress`     | `permanent_address` |
| `currentAddress`       | `current_address`   |
| `isActive`             | `is_active`         |

### ApprovalToken (`approval_tokens`)

| JavaScript (canonical) | Database column |
| ---------------------- | --------------- |
| `roleRequired`         | `role_required` |
| `isUsed`               | `is_used`       |

### Payment (`payments`)

| JavaScript (canonical) | Database column     |
| ---------------------- | ------------------- |
| `razorpayOrderId`      | `razorpay_order_id` |

### FileUpload (`file_uploads`)

| JavaScript (canonical) | Database column |
| ---------------------- | --------------- |
| `fileType`             | `file_type`     |
| `minioUrl`             | `minio_url`     |

### Admin (`admins`)

| JavaScript (canonical) | Database column |
| ---------------------- | --------------- |
| `phoneNumber`          | `phone_number`  |

### Region (`regions`)

| JavaScript (canonical) | Database column |
| ---------------------- | --------------- |
| `isActive`             | `is_active`     |
