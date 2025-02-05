<template>
  <div class="about">
    <h1>About Our Project</h1>
    <section class="project-explanation">
      <p>
        Welcome! This project is dedicated to exploring and sharing the beauty and
        adventure of various routes. We aim to provide detailed information,
        stunning visuals, and practical resources to help you plan your next
        expedition.
      </p>
      <p>
        Our platform offers interactive maps, route descriptions, and insights
        into what makes each route unique. Whether you're a seasoned explorer or
        a curious beginner, we hope to inspire your next journey.
      </p>
      <p>
        Each route includes details about the journey, stop points, nearby places
        and more!
      </p>
    </section>

    <section class="pricing">
      <h2>Pricing</h2>
      <p>
        We offer access to detailed route information on a monthly subscription
        basis.
      </p>
      <ul>
        <li>
          <strong>Per Route:</strong> $9.99/month
        </li>
      </ul>
      <p>
        With this subscription you will have access to the route descriptions,
        photos, journey details, and more!
      </p>
    </section>

    <section class="contact">
      <h2>Contact Us</h2>
      <p>
        Have questions or want to share your experiences? Reach out to us using
        the form below.
      </p>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" id="name" v-model="name" required />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="message">Message:</label>
          <textarea id="message" v-model="message" required></textarea>
        </div>
        <button type="submit">Send Message</button>
        <p v-if="isSubmitted">Message sent!</p>
      </form>
    </section>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  setup() {
    const name = ref("");
    const email = ref("");
    const message = ref("");
    const isSubmitted = ref(false);
    const submitForm = () => {
      // Here you could implement an api call to send data to an endpoint
      // then if the result is ok, set isSubmitted to true.
      // you may want to add validations before submitting
      isSubmitted.value = true;
      setTimeout(() => {
        name.value = "";
        email.value = "";
        message.value = "";
        isSubmitted.value = false;
      }, 2000);
    };
    return {
      name,
      email,
      message,
      isSubmitted,
      submitForm,
    };
  },
};
</script>

<style scoped>
.about {
  padding: 20px;
}

.project-explanation,
.pricing,
.contact {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="text"],
input[type="email"],
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

textarea {
  height: 150px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>