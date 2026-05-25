import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const S_ID = ''; // filled after school creation

async function main() {
  console.log('🔄 Running prisma db push...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (e) {
    console.log('DB push done with warnings, continuing...');
  }

  console.log('🌱 Seeding database...');

  // Check if already seeded
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@omixsystems.com' } });
  if (existingAdmin) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  // 1. School
  const sc = await prisma.school.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Omix Demo Academy', slug: 'demo', subdomain: 'demo',
      address: '123 Learning Avenue, Nairobi', phone: '+254 700 100 200',
      email: 'info@omixdemoacademy.com', isActive: true, isApproved: true,
    },
  });
  const SID = sc.id;
  console.log(`✅ Demo school: ${sc.name}`);

  // 2. Super Admin
  const saPw = await bcrypt.hash('Marvel254!', 12);
  await prisma.user.create({
    data: { email: 'admin@omixsystems.com', name: 'System Super Admin', password: saPw, role: 'super_admin' },
  });
  console.log('✅ Super admin: admin@omixsystems.com / Marvel254!');

  // 3. School Admin
  const schPw = await bcrypt.hash('admin123', 12);
  const schoolAdmin = await prisma.user.create({
    data: { email: 'demo.admin@demo.school', name: 'Demo School Admin', password: schPw, role: 'school_admin', school: { connect: { id: SID } } },
  });
  console.log('✅ Demo admin: demo.admin@demo.school / admin123');

  // 4. Teacher User
  const tchPw = await bcrypt.hash('teacher123', 12);
  await prisma.user.create({
    data: { email: 'demo.teacher@demo.school', name: 'Demo Teacher', password: tchPw, role: 'teacher', school: { connect: { id: SID } } },
  });
  console.log('✅ Demo teacher: demo.teacher@demo.school / teacher123');

  // 5. Teachers
  const t1 = await prisma.teacher.create({ data: { employeeNo: 'TCH001', firstName: 'Grace', lastName: 'Mwangi', gender: 'female', specialization: 'Mathematics', school: { connect: { id: SID } } } });
  const t2 = await prisma.teacher.create({ data: { employeeNo: 'TCH002', firstName: 'Peter', lastName: 'Kamau', gender: 'male', specialization: 'English Language', school: { connect: { id: SID } } } });
  const t3 = await prisma.teacher.create({ data: { employeeNo: 'TCH003', firstName: 'Sarah', lastName: 'Ochieng', gender: 'female', specialization: 'Sciences', school: { connect: { id: SID } } } });
  console.log('✅ Teachers created');

  // 6. Classes
  const c1 = await prisma.class.create({ data: { name: 'Grade 8 Alpha', code: 'G8A-2026', academicYear: '2026', capacity: 40, teacher: { connect: { id: t1.id } }, school: { connect: { id: SID } } } });
  const c2 = await prisma.class.create({ data: { name: 'Grade 8 Beta', code: 'G8B-2026', academicYear: '2026', capacity: 40, teacher: { connect: { id: t2.id } }, school: { connect: { id: SID } } } });
  const c3 = await prisma.class.create({ data: { name: 'Grade 7 Alpha', code: 'G7A-2026', academicYear: '2026', capacity: 35, teacher: { connect: { id: t3.id } }, school: { connect: { id: SID } } } });
  const classes = [c1, c2, c3];
  console.log('✅ Classes created');

  // 7. Subjects (use relations, avoid raw IDs)
  await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH', category: 'core', teacher: { connect: { id: t1.id } }, class: { connect: { id: c1.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'English', code: 'ENG', category: 'core', teacher: { connect: { id: t2.id } }, class: { connect: { id: c1.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'Kiswahili', code: 'KISW', category: 'core', class: { connect: { id: c1.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'Science', code: 'SCI', category: 'core', teacher: { connect: { id: t3.id } }, class: { connect: { id: c1.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'Social Studies', code: 'SST', category: 'core', class: { connect: { id: c1.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'CRE', code: 'CRE2', category: 'core', class: { connect: { id: c2.id } }, school: { connect: { id: SID } } } });
  await prisma.subject.create({ data: { name: 'Computer Science', code: 'COMP', category: 'elective', school: { connect: { id: SID } } } });
  console.log('✅ Subjects created');

  // 8. Students (sequential for SQLite)
  const names = [['Brian','Kiprop'],['Cynthia','Wanjiku'],['Daniel','Omondi'],['Esther','Wambui'],['Felix','Mutua'],['Grace','Akinyi'],['Henry','Njoroge'],['Irene','Chebet'],['James','Mwangi'],['Kevin','Otieno'],['Lynn','Nyambura'],['Michael','Kiprono'],['Nancy','Wairimu'],['Oscar','Kipkemboi'],['Phyllis','Jerono'],['Samuel','Kimani'],['Teresia','Njeri'],['Victor','Okoth'],['Winnie','Achieng'],['Zachary','Maina']];
  const students = [];
  for (let i = 0; i < names.length; i++) {
    const s = await prisma.student.create({
      data: { admissionNo: 'DEMO' + String(i+1).padStart(4,'0'), firstName: names[i][0], lastName: names[i][1], gender: i%2===0?'male':'female', school: { connect: { id: SID } } },
    });
    students.push(s);
  }
  console.log(`✅ ${students.length} Students created`);

  // 9. Enrollments (sequential)
  for (let i = 0; i < students.length; i++) {
    await prisma.enrollment.create({ data: { student: { connect: { id: students[i].id } }, class: { connect: { id: classes[i%3].id } }, academicYear: '2026', school: { connect: { id: SID } } } });
  }
  console.log('✅ Enrollments created');

  // 10. Exam
  const exam = await prisma.exam.create({
    data: { name: 'End of Term 1', term: 'Term 1', academicYear: '2026', startDate: new Date('2026-04-14'), endDate: new Date('2026-04-25'), school: { connect: { id: SID } } },
  });
  console.log('✅ Exam created');

  // 11. Grades (sequential)
  const subs = await prisma.subject.findMany({ where: { schoolId: SID } });
  for (let i = 0; i < Math.min(students.length, 8); i++) {
    for (const subj of subs.slice(0, 4)) {
      const score = Math.round(40 + Math.random() * 60);
      await prisma.grade.create({
        data: {
          student: { connect: { id: students[i].id } },
          subject: { connect: { id: subj.id } },
          exam: { connect: { id: exam.id } },
          classId: classes[i%3].id,
          score,
          grade: score>=80?'A':score>=70?'B':score>=60?'C':score>=50?'D':'E',
          schoolId: SID,
        },
      });
    }
  }
  console.log('✅ Grades created');

  // 12. Fee Structures
  const tu = await prisma.feeStructure.create({ data: { name: 'Tuition Fee', amount: 25000, academicYear: '2026', school: { connect: { id: SID } } } });
  await prisma.feeStructure.create({ data: { name: 'Transport Fee', amount: 8000, academicYear: '2026', school: { connect: { id: SID } } } });
  await prisma.feeStructure.create({ data: { name: 'Lunch Program', amount: 5000, academicYear: '2026', school: { connect: { id: SID } } } });
  console.log('✅ Fee structures created');

  for (let i = 0; i < 5; i++) {
    await prisma.feePayment.create({
      data: {
        feeStructure: { connect: { id: tu.id } },
        student: { connect: { id: students[i].id } },
        user: { connect: { id: schoolAdmin.id } },
        amount: 25000,
        paymentDate: new Date(2026,0,15+i*2),
        method: 'mpesa', term: 'Term 1', academicYear: '2026',
        school: { connect: { id: SID } },
      },
    });
  }
  console.log('✅ Fee payments created');

  // 13. Timetable
  const subs2 = await prisma.subject.findMany({ where: { schoolId: SID } });
  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < 4; s++) {
      await prisma.timetable.create({
        data: {
          class: { connect: { id: c1.id } },
          subject: { connect: { id: subs2[(d*4+s)%subs2.length].id } },
          dayOfWeek: d, startTime: '08:00', endTime: '08:45', room: 'Room ' + (100+s),
          school: { connect: { id: SID } },
        },
      });
    }
  }

  // 14. Announcements
  await prisma.announcement.create({
    data: { title: 'Welcome to Term 1, 2026', content: 'All students must report by 7:45 AM.', author: { connect: { id: schoolAdmin.id } }, priority: 'high', target: 'all', school: { connect: { id: SID } } },
  });
  await prisma.announcement.create({
    data: { title: 'Staff Meeting - Friday', content: 'Staff meeting on Friday at 2:30 PM.', author: { connect: { id: schoolAdmin.id } }, priority: 'normal', target: 'teachers', school: { connect: { id: SID } } },
  });
  console.log('✅ Announcements created');

  console.log('\n🎉 Seed complete!');
  console.log('   Super Admin:  admin@omixsystems.com / Marvel254!');
  console.log('   School Admin: demo.admin@demo.school / admin123');
  console.log('   Demo Teacher: demo.teacher@demo.school / teacher123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());