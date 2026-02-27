import { prisma } from './src/lib/prisma'
import bcrypt from 'bcryptjs'

async function checkAdmin() {
    try {
        console.log('\n🔍 Checking for admin user...\n')

        const user = await prisma.user.findUnique({
            where: { email: 'admin@civas.com' }
        })

        if (!user) {
            console.log('❌ Admin user NOT found in database')
            console.log('Creating admin user now...\n')

            const hashedPassword = await bcrypt.hash('admin123', 10)

            const newUser = await prisma.user.create({
                data: {
                    email: 'admin@civas.com',
                    name: 'Admin User',
                    firstName: 'Admin',
                    lastName: 'User',
                    password: hashedPassword,
                    role: 'SUPERADMIN',
                }
            })

            console.log('✅ Admin user created successfully!')
            console.log('User ID:', newUser.id)
            console.log('Email:', newUser.email)
            console.log('Role:', newUser.role)
            console.log('\n🔐 You can now login with:')
            console.log('   Email: admin@civas.com')
            console.log('   Password: admin123\n')
        } else {
            console.log('✅ Admin user found!')
            console.log('User ID:', user.id)
            console.log('Email:', user.email)
            console.log('Name:', user.name)
            console.log('Role:', user.role)
            console.log('Has Password:', !!user.password)

            if (user.password) {
                console.log('\n🔐 Testing password...')
                const isValidPassword = await bcrypt.compare('admin123', user.password)

                if (isValidPassword) {
                    console.log('✅ Password is CORRECT')
                    console.log('\n🎯 Login should work with:')
                    console.log('   Email: admin@civas.com')
                    console.log('   Password: admin123\n')
                } else {
                    console.log('❌ Password is INCORRECT')
                    console.log('Updating password now...\n')

                    const newHash = await bcrypt.hash('admin123', 10)
                    await prisma.user.update({
                        where: { email: 'admin@civas.com' },
                        data: { password: newHash }
                    })

                    console.log('✅ Password updated!')
                    console.log('Try logging in again with:')
                    console.log('   Email: admin@civas.com')
                    console.log('   Password: admin123\n')
                }
            } else {
                console.log('❌ User has no password set')
                console.log('Setting password now...\n')

                const newHash = await bcrypt.hash('admin123', 10)
                await prisma.user.update({
                    where: { email: 'admin@civas.com' },
                    data: { password: newHash }
                })

                console.log('✅ Password set!')
                console.log('Try logging in with:')
                console.log('   Email: admin@civas.com')
                console.log('   Password: admin123\n')
            }
        }
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkAdmin()
