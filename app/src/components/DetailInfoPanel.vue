<script>
import { useRouteInfoStore } from '../stores/routestatus.js';

export default {
  setup() {
    const routeStatus = useRouteInfoStore();

    return {
      routeStatus
    }

  },
  data() {
    return {
      isScrolled: false,  // Tracks whether scrollTop is > 0 or not
    };
  },
  methods: {
    logScroll(event) {
      console.log("Loggin")
      const panel = event.target;
      const isNowScrolled = panel.scrollTop > 0;

      // Emit only when scroll state changes between 0 and >0
      if (this.isScrolled !== isNowScrolled) {
        this.isScrolled = isNowScrolled;
        this.$emit('scrollStateChanged', this.isScrolled); // Emit scroll state to parent
        console.log("emittin")
      }
    },
  },
};
</script>

<template>
  <div class="content-wrapper" @scroll="logScroll">
    <div v-if="routeStatus.activeTopic === 'overview'">
          <h2>{{ routeStatus.routeMetadata.title }}</h2>
          <p>{{ routeStatus.routeMetadata.description }}</p>
          <img :src="routeStatus.routeMetadata.banner" alt="Route Banner">
        </div>
        <div v-if="routeStatus.activeTopic === 'route'">
          <h2>{{ routeStatus.activeFeature.properties.title }}</h2>
          <img
            v-if="routeStatus.activeFeature.images?.length"
            :src="'img/' + routeStatus.activeFeature.images[0]"
            alt="Feature Image"
          />
          <div class="content-actual-content">
          <p>{{ routeStatus.activeFeature.properties.description }}</p>
          <div>
          <div>
            <h3>
            Lorum Ipsum?
            </h3>

            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </div>
          <div>
            <h3>
            Why do we use it?
            </h3>
            <p>
            It is a long established fact that a reader will be distracted by the readable content of a page when
            looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of
            letters, as opposed to using 'Content here, content here', making it look like readable English. Many
            desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a
            search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved
            over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
</p>
            Where does it come from?

            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical
            Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at
            Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem
            Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable
            source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
            of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular
            during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in
            section 1.10.32.
          </div>
        </div>
</div>
        </div>
      </div>

</template>

<style scoped>

.content-wrapper {
      overflow-y: auto;
  max-height: 100%;
  height: 100%;
  padding: 40px;

}
.content-actual-content {
    max-height: 100%;
  overflow: visible;

}
img {
  max-width: 100%;
  height: auto;
}

</style>
