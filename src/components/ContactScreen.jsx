import { motion } from 'framer-motion';

const ContactScreen = () => {
  const contacts = [
    {
      icon: '📞',
      title: 'Office Phone',
      numbers: ['+91 8499243719', '+91 8499243775'],
      description: 'Available during school hours (Mon-Sat, 8:30 AM - 4:30 PM)\nClosed on Sundays, second Saturdays & academic holidays'
    },
    {
      icon: '🏛️',
      title: 'Sri Kanchi Kamakoti Sankara Vidyalaya',
      address: 'Sanatana Dharma Seva Gramam,\nPodili - 523252, Markapur District,\nAndhra Pradesh',
      description: 'Near Ongole'
    },
    {
      icon: '🌐',
      title: 'Location',
      link: 'https://maps.app.goo.gl/tJxDJYtwDYMbrGzv9',
      linkText: 'View on Google Maps'
    }
  ];

  return (
    <div className="w-full flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Us</h2>
          <p className="text-gray-500 dark:text-gray-400">Get in touch with the school office</p>
        </motion.div>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{contact.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{contact.title}</h3>
                  
                  {contact.numbers && (
                    <div className="space-y-1">
                      {contact.numbers.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num}`}
                          className="block text-primary hover:text-primary/80 transition-colors text-lg font-medium"
                        >
                          {num}
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {contact.address && (
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">
                      {contact.address}
                    </p>
                  )}
                  
                  {contact.link && (
                    <a
                      href={contact.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all text-sm font-medium mt-2"
                    >
                      {contact.linkText}
                    </a>
                  )}
                  
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">{contact.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            For admissions, fee payments, or general queries, please call during office hours.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactScreen;