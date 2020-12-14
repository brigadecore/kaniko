# Brigade Kaniko Image

[Kaniko](https://github.com/GoogleContainerTools/kaniko) is a standalone tool
for building OCI images. For projects that utilize containerized test and build
processes within their CI/CD pipelines, Kaniko offers a simple, secure
alternative to established, but comparatively complex and less secure options
for building OCI images within OCI containers-- patterns Such a "Docker in
Docker" (DinD) or "Docker out of Docker" (DooD).

The standard Kaniko image is not compatible with
[Brigade](https://github.com/brigadecore/brigade) 1.x because Brigade 1.x jobs
implicitly requires images to include a shell. This project, therefore, provides
a bespoke Kaniko image to facilitate development of Brigade itself, several
related projects, and in general, projects that utilize Brigade 1.x to
orchestrate their CI/CD pipelines.

## Contributing

The Brigade project accepts contributions via GitHub pull requests. The
[Contributing](CONTRIBUTING.md) document outlines the process to help get your
contribution accepted.

## Support & Feedback

We have a slack channel!
[Kubernetes/#brigade](https://kubernetes.slack.com/messages/C87MF1RFD) Feel free
to join for any support questions or feedback, we are happy to help. To report
an issue or to request a feature open an issue
[here](https://github.com/brigadecore/kaniko/issues).
