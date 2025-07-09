// Set the wedding date (December 14th, 2024 at 4:00 PM)
const weddingDate = new Date('December 14, 2024 16:00:00').getTime();

// Music player variables
let audio, isPlaying = false;

// Initialize music player elements when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    audio = document.getElementById('backgroundMusic');
});

// Database functions
function getAttendees() {
    const attendees = localStorage.getItem('weddingAttendees');
    return attendees ? JSON.parse(attendees) : [];
}

function saveAttendee(attendeeData) {
    const attendees = getAttendees();
    attendees.push({
        ...attendeeData,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('weddingAttendees', JSON.stringify(attendees));
}

function exportAttendeesData() {
    const attendees = getAttendees();
    const csvContent = convertToCSV(attendees);
    downloadCSV(csvContent, 'wedding-attendees.csv');
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(',')
        )
    ];
    
    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Countdown timer function
function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update the countdown display
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

    // If the wedding has passed
    if (distance < 0) {
        document.querySelector('.countdown-section').innerHTML = `
            <h2>Our Special Day Has Arrived!</h2>
            <p style="font-size: 1.5rem; color: #D4AF37;">Thank you for celebrating with us!</p>
        `;
    }
}

// Background slideshow function
function startSlideshow() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); // Change slide every 5 seconds
}

// Modal functions
function showAttendeeForm(rsvpType) {
    const modal = document.getElementById('attendeeModal');
    const modalTitle = document.getElementById('modalTitle');
    const rsvpTypeInput = document.getElementById('rsvpType');
    
    // Set the RSVP type
    rsvpTypeInput.value = rsvpType;
    
    // Update modal title based on RSVP type
    if (rsvpType === 'attending') {
        modalTitle.textContent = "We're so excited you're coming! Please provide your details";
    } else {
        modalTitle.textContent = "We'll miss you! Please provide your details";
    }
    
    // Show the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('attendeeModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('attendeeForm').reset();
    document.getElementById('companionDetails').style.display = 'none';
}

function toggleCompanionDetails() {
    const companionSelect = document.getElementById('companion');
    const companionDetails = document.getElementById('companionDetails');
    const companionNameInput = document.getElementById('companionName');
    
    if (companionSelect.value === 'yes') {
        companionDetails.style.display = 'block';
        companionNameInput.required = true;
    } else {
        companionDetails.style.display = 'none';
        companionNameInput.required = false;
        companionNameInput.value = '';
    }
}

// Form submission
function submitRSVP(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const rsvpType = formData.get('rsvpType');
    const name = formData.get('name'); // Always get the name
    
    console.log('=== RSVP SUBMISSION DEBUG ===');
    console.log('RSVP Type:', rsvpType);
    console.log('Name from form:', name);
    console.log('Name field exists:', !!document.getElementById('name'));
    console.log('Name field value:', document.getElementById('name').value);
    console.log('Name field visible:', document.getElementById('name').style.display !== 'none');
    console.log('Form data entries:', Array.from(formData.entries()));

    let attendeeData = {
        name: name, // Always set the name
        rsvpType: rsvpType
    };
    
    // FORCE name to be set if somehow it's empty
    if (!attendeeData.name || attendeeData.name.trim() === '') {
        const nameFromInput = document.getElementById('name').value;
        console.log('Name was empty, trying direct input value:', nameFromInput);
        attendeeData.name = nameFromInput;
    }
    
    if (rsvpType === 'attending') {
        attendeeData = {
            ...attendeeData,
            email: formData.get('email'),
            phone: formData.get('phone'),
            city: formData.get('city'),
            relationship: formData.get('relationship'),
            companionName: formData.get('companionName'),
            dietary: formData.get('dietary'),
            message: formData.get('message')
        };
    } else if (rsvpType === 'not-attending') {
        attendeeData = {
            ...attendeeData,
            reason: formData.get('reason')
        };
    }
    
    console.log('Attendee data after processing:', attendeeData);
    
    // Mark invitation as used FIRST (before saving attendee data)
    const invitationPassword = sessionStorage.getItem('invitationPassword');
    let invitationMarked = false;
    
    if (invitationPassword) {
        try {
            const invitations = JSON.parse(localStorage.getItem('invitations') || '[]');
            const invitation = invitations.find(inv => inv.password === invitationPassword);
            
            if (invitation && !invitation.used) {
                invitation.used = true;
                invitation.usedDate = new Date().toISOString();
                invitation.rsvpType = rsvpType; // Store what type of RSVP was submitted
                localStorage.setItem('invitations', JSON.stringify(invitations));
                invitationMarked = true;
                console.log(`Invitation marked as used for ${invitation.guestName} (${rsvpType})`);
            } else if (invitation && invitation.used) {
                console.log(`Invitation already used for ${invitation.guestName}`);
                alert('This invitation has already been used. Please contact the couple if you need assistance.');
                return;
            } else {
                console.log('Invitation not found in database');
                alert('Invitation not found. Please contact the couple for assistance.');
                return;
            }
        } catch (error) {
            console.error('Error marking invitation as used:', error);
            alert('Error processing invitation. Please try again or contact the couple.');
            return;
        }
    } else {
        console.log('No invitation password found in session storage');
        alert('No invitation found. Please contact the couple for assistance.');
        return;
    }
    
    // Only proceed if invitation was successfully marked
    if (!invitationMarked) {
        alert('Unable to process invitation. Please contact the couple for assistance.');
        return;
    }
    
    // Add invitation password to attendee data for linking
    attendeeData.invitationPassword = invitationPassword;
    // Force the name field to always be what the user entered
    attendeeData.name = formData.get('name') || document.getElementById('name').value;
    
    console.log('Final RSVP data about to be saved:', attendeeData);
    console.log('Name should be:', attendeeData.name);
    
    // Save to database
    saveAttendee(attendeeData);

    // Close modal
    closeModal();
    
    // Show success message
    showRSVPMessage(attendeeData.rsvpType);
    
    // Add confetti if attending
    if (attendeeData.rsvpType === 'attending') {
        addConfetti();
    }
    
    // Disable RSVP buttons
    const buttons = document.querySelectorAll('.rsvp-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    // Logout user after RSVP submission (both attending and not attending)
    setTimeout(() => {
        // Clear session storage to logout
        sessionStorage.removeItem('invitationPassword');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        
        // Show logout message
        const messageDiv = document.getElementById('rsvp-message');
        messageDiv.textContent = "Thank you for your RSVP! You have been logged out. Redirecting to login page...";
        messageDiv.className = 'rsvp-message show attending';
        
        // Force redirect to login page
        setTimeout(() => {
            // Clear any remaining session data
            sessionStorage.clear();
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            
            // Redirect to login page
            window.location.replace('login.html');
        }, 2000); // Redirect after 2 seconds
    }, 2000); // Wait 2 seconds before logging out
}

function showRSVPMessage(rsvpType) {
    const messageDiv = document.getElementById('rsvp-message');
    
    if (rsvpType === 'attending') {
        messageDiv.textContent = "Thank you for your RSVP! We're so excited to celebrate with you! 💒";
        messageDiv.className = 'rsvp-message show attending';
    } else {
        messageDiv.textContent = "Thank you for letting us know. We'll miss you! 💔";
        messageDiv.className = 'rsvp-message show not-attending';
    }
}

// Check for existing RSVP response
function checkExistingRSVP() {
    const attendees = getAttendees();
    const userEmail = localStorage.getItem('userEmail');
    
    if (userEmail && attendees.length > 0) {
        const existingRSVP = attendees.find(attendee => attendee.email === userEmail);
        
        if (existingRSVP) {
            const messageDiv = document.getElementById('rsvp-message');
            const buttons = document.querySelectorAll('.rsvp-btn');
            
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.6';
            });
            
            if (existingRSVP.rsvpType === 'attending') {
                messageDiv.textContent = `You've already confirmed you'll be there, ${existingRSVP.name}! We can't wait to see you! 💒`;
                messageDiv.className = 'rsvp-message show attending';
            } else {
                messageDiv.textContent = `You've already let us know you can't make it, ${existingRSVP.name}. We'll miss you! 💔`;
                messageDiv.className = 'rsvp-message show not-attending';
            }
        }
    }
}

// Music Player Functionality
function initMusicPlayer() {
    console.log('Initializing music player...');
    
    if (!audio) {
        console.log('Music player element not found.');
        return;
    }
    
    console.log('Music player element found!');
    
    // Set default volume (25% - gentle background music)
    audio.volume = 0.25;
    console.log('Volume set to:', audio.volume);
    
    // Add event listeners for auto-play
    audio.addEventListener('canplay', function() {
        console.log('Audio can play!');
        
        // Check if we should auto-start music after login
        const shouldAutoStart = sessionStorage.getItem('autoStartMusic');
        if (shouldAutoStart === 'true') {
            console.log('Auto-starting music after login...');
            sessionStorage.removeItem('autoStartMusic'); // Remove flag after use
            
            // Auto-start music with a small delay for better UX
            setTimeout(() => {
                audio.play().then(() => {
                    console.log('Music auto-started successfully!');
                    isPlaying = true;
                    // Show a subtle notification
                    showMusicStartedNotification();
                }).catch(err => {
                    console.error('Auto-play failed:', err);
                    console.log('Browser blocked auto-play, will try on first user interaction');
                    // Add fallback for browsers that block auto-play
                    addAutoPlayFallback();
                });
            }, 1000); // 1 second delay for smoother experience
        }
    });
    
    audio.addEventListener('loadeddata', function() {
        console.log('Audio data loaded successfully!');
    });
    
    // Add error handling for audio
    audio.addEventListener('error', function(e) {
        console.error('Audio error:', e);
        console.error('Audio error details:', audio.error);
    });
    
    // Try to load the audio
    audio.load();
    
    console.log('Music player initialization complete!');
}

// Add fallback for browsers that block auto-play
function addAutoPlayFallback() {
    document.addEventListener('click', function() {
        console.log('User clicked, attempting to play music...');
        if (!isPlaying && audio.paused) {
            audio.play().then(() => {
                console.log('Music started playing successfully after user interaction!');
                isPlaying = true;
                showMusicStartedNotification();
            }).catch(err => {
                console.error('Play failed even after user interaction:', err);
            });
        }
    }, { once: true });
}

// Toggle play/pause
function togglePlayPause() {
    console.log('Toggle play/pause clicked. Current state - isPlaying:', isPlaying, 'audio.paused:', audio.paused);
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        console.log('Music paused');
    } else {
        audio.play().then(() => {
            isPlaying = true;
            console.log('Music playing');
        }).catch(err => {
            console.error('Play failed:', err);
            alert('Unable to play music. Please check your audio settings or try a different browser.');
        });
    }
    // No need to call updatePlayButton() as there's no visible button
}

// Update play button appearance
function updatePlayButton() {
    // No visible button to update
}

// Adjust volume
function adjustVolume() {
    // No visible volume slider
}

// Handle audio events
if (audio) {
    audio.addEventListener('ended', function() {
        // Audio will loop automatically due to loop attribute
    });

    audio.addEventListener('play', function() {
        isPlaying = true;
        // No need to call updatePlayButton() as there's no visible button
    });

    audio.addEventListener('pause', function() {
        isPlaying = false;
        // No need to call updatePlayButton() as there's no visible button
    });
}

// Add some interactive effects
function addInteractiveEffects() {
    // Add hover effects to countdown numbers
    const countdownNumbers = document.querySelectorAll('.countdown-number');
    countdownNumbers.forEach(number => {
        number.addEventListener('mouseenter', () => {
            number.style.transform = 'scale(1.1)';
        });
        number.addEventListener('mouseleave', () => {
            number.style.transform = 'scale(1)';
        });
    });

    // Add click effects to RSVP buttons
    const rsvpButtons = document.querySelectorAll('.rsvp-btn');
    rsvpButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Add confetti effect
function addConfetti() {
    // Simple confetti effect for celebration
    const colors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1000';
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Add confetti animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize music player
    initMusicPlayer();
    
    // Start the countdown timer
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Start the background slideshow
    startSlideshow();

    // Check for existing RSVP
    checkExistingRSVP();

    // Add interactive effects
    addInteractiveEffects();

    // Add some nice entrance animations
    const sections = document.querySelectorAll('.countdown-section, .rsvp-section, .details-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('attendeeModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});

// Admin functions (for the couple to access attendee data)
function showAdminPanel() {
    const attendees = getAttendees();
    const attending = attendees.filter(a => a.rsvpType === 'attending');
    const notAttending = attendees.filter(a => a.rsvpType === 'not-attending');
    
    console.log('=== WEDDING ATTENDEES DATA ===');
    console.log(`Total RSVPs: ${attendees.length}`);
    console.log(`Attending: ${attending.length}`);
    console.log(`Not Attending: ${notAttending.length}`);
    console.log('\n=== ATTENDING GUESTS ===');
    attending.forEach(guest => {
        console.log(`${guest.name} (${guest.email}) - ${guest.city}`);
        if (guest.companion === 'yes') {
            console.log(`  + Companion: ${guest.companionName}`);
        }
        if (guest.dietary) {
            console.log(`  Dietary: ${guest.dietary}`);
        }
    });
    console.log('\n=== NOT ATTENDING ===');
    notAttending.forEach(guest => {
        console.log(`${guest.name} (${guest.email}) - ${guest.city}`);
    });
    
    // Export data
    exportAttendeesData();
} 

// Show a subtle notification that music has started
function showMusicStartedNotification() {
    const notification = document.createElement('div');
    notification.textContent = '🎵 Romantic piano music is playing softly in the background';
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 18px;
        border-radius: 20px;
        font-size: 13px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        max-width: 250px;
        text-align: center;
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);
    
    // Fade out and remove after 4 seconds (longer since it's informative)
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
} 